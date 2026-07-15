import type { CredentialRecord, CredentialViewModel } from "@common/types";
import { debugLog } from "../common/debug";
import {
  buildExternalSecretIndex,
  getExternalSecretConditions,
  getExternalSecretReadyMessage,
  getExternalSecretRefreshInterval,
  getExternalSecretRemoteRefs,
  getExternalSecretStatus,
  getExternalSecretStore,
  loadExternalSecrets,
  type ExternalSecretLike
} from "./analyzers/external-secrets";
import { getTlsCertificateInfo } from "./analyzers/tls";
import {
  collectPodSecretReferences,
  collectServiceAccountSecretReferences,
  findDeploymentNameForPod,
  collectWorkloadTemplateSecretReferences,
  formatWorkloadTemplateUsage,
  getWorkloadTemplateServiceAccountName,
  type WorkloadTemplateKind,
  type WorkloadTemplateUsage
} from "./analyzers/workload-references";
import {
  loadCronJobs,
  loadDaemonSets,
  loadDeployments,
  loadJobs,
  loadPods,
  loadSecrets,
  loadServiceAccounts,
  loadStatefulSets
} from "./cluster-resource-loader";
import {
  differenceInCalendarDays,
  getObjectCreationTimestamp,
  getObjectName,
  getObjectNamespace,
  getOwnerRefs,
  type KubeObjectLike
} from "./k8s-object-utils";

const now = new Date();

interface CredentialLoadResult {
  rows: CredentialViewModel[];
  source: "cluster" | "empty" | "error";
  error?: string;
}

function inferOrigin(secret: KubeObjectLike): CredentialRecord["origin"] {
  const secretName = getObjectName(secret);
  const namespace = getObjectNamespace(secret);
  const secretType = secret.type ?? "";
  const labels = secret.metadata?.labels ?? {};
  const annotations = secret.metadata?.annotations ?? {};
  const ownerReferences = getOwnerRefs(secret);

  if (secretName.startsWith("sh.helm.release.v1.") || secretType.startsWith("helm.sh/release")) {
    return "helm";
  }

  if (
    secretType === "kubernetes.io/service-account-token" ||
    (namespace === "kube-system" && (secretName.endsWith(".node-password.k3s") || secretName === "k3s-serving"))
  ) {
    return "kubernetes";
  }

  if (
    ownerReferences.some((reference) => reference.kind === "Certificate" && reference.apiVersion?.startsWith("cert-manager.io/")) ||
    Object.keys(annotations).some((key) => key.startsWith("cert-manager.io/")) ||
    Object.keys(labels).some((key) => key.startsWith("controller.cert-manager.io/"))
  ) {
    return "cert-manager";
  }

  if (namespace === "argocd" || Boolean(labels["argocd.argoproj.io/secret-type"]) || secretName.startsWith("argocd-")) {
    return "argocd";
  }

  const metadataText = JSON.stringify({
    labels,
    annotations,
    owners: ownerReferences
  }).toLowerCase();

  if (metadataText.includes("vault")) {
    return "vault";
  }

  if (metadataText.includes("externalsecret") || metadataText.includes("external-secrets")) {
    return "external-secrets";
  }

  if (annotations["meta.helm.sh/release-name"] || labels["app.kubernetes.io/managed-by"]?.toLowerCase() === "helm") {
    return "helm";
  }

  return "manual";
}

function isWorkloadCredentialCandidate(secret: KubeObjectLike, origin: CredentialRecord["origin"]): boolean {
  if (origin === "helm" || origin === "kubernetes") {
    return false;
  }

  const secretType = secret.type ?? "Opaque";

  return [
    "Opaque",
    "kubernetes.io/basic-auth",
    "kubernetes.io/dockerconfigjson",
    "kubernetes.io/dockercfg",
    "kubernetes.io/ssh-auth",
    "kubernetes.io/tls"
  ].includes(secretType);
}

function getUsageClassLabel(value: CredentialRecord["usageClass"]): string {
  if (value === "workload-referenced") {
    return "workload referenced";
  }

  if (value === "controller-api-consumed") {
    return "controller/API consumed candidate";
  }

  if (value === "operator-managed") {
    return "operator managed";
  }

  if (value === "bootstrap-credential") {
    return "bootstrap credential";
  }

  if (value === "platform-technical") {
    return "platform technical";
  }

  return "orphan candidate";
}

function getRelationFallbackLabel(origin: CredentialRecord["origin"], usageClass: CredentialRecord["usageClass"]): string {
  if (usageClass === "orphan-candidate") {
    return "orphan";
  }

  if (usageClass === "operator-managed") {
    return "operator managed";
  }

  if (usageClass === "controller-api-consumed") {
    return "controller/API consumed";
  }

  if (usageClass === "bootstrap-credential") {
    return "bootstrap credential";
  }

  if (usageClass === "platform-technical") {
    return `managed by ${origin}`;
  }

  return getUsageClassLabel(usageClass);
}

function hasControllerApiConsumptionHint(secret: KubeObjectLike): boolean {
  const namespace = getObjectNamespace(secret).toLowerCase();
  const secretName = getObjectName(secret).toLowerCase();
  const dataKeys = Object.keys(secret.data ?? {}).join(" ").toLowerCase();
  const metadataText = JSON.stringify({
    labels: secret.metadata?.labels ?? {},
    annotations: secret.metadata?.annotations ?? {}
  }).toLowerCase();
  const text = `${namespace} ${secretName} ${dataKeys} ${metadataText}`;

  return [
    /\bargocd\b/,
    /\bcert-manager\b/,
    /\bexternal-secrets\b/,
    /\bsealed-secrets\b/,
    /\bvault\b/,
    /\bcontroller\b/,
    /\boperator\b/,
    /notifications/,
    /webhook/,
    /server\.secretkey/,
    /admin\.password/,
    /\.secret$/
  ].some((pattern) => pattern.test(text));
}

function inferUsageClass(
  secret: KubeObjectLike,
  origin: CredentialRecord["origin"],
  usingPods: KubeObjectLike[],
  workloadTemplatesUsingSecret: WorkloadTemplateUsage[],
  serviceAccountsUsingSecret: KubeObjectLike[],
  externalSecret?: ExternalSecretLike
): CredentialRecord["usageClass"] {
  const secretName = getObjectName(secret).toLowerCase();
  const namespace = getObjectNamespace(secret).toLowerCase();
  const ownerReferences = getOwnerRefs(secret);

  if (usingPods.length > 0 || workloadTemplatesUsingSecret.length > 0 || serviceAccountsUsingSecret.length > 0) {
    return "workload-referenced";
  }

  if (
    origin === "helm" ||
    origin === "kubernetes" ||
    (namespace === "kube-system" && (secretName.endsWith(".node-password.k3s") || secretName === "k3s-serving"))
  ) {
    return "platform-technical";
  }

  if (origin === "argocd") {
    return "controller-api-consumed";
  }

  if (origin === "cert-manager" || externalSecret || ownerReferences.length > 0) {
    return "operator-managed";
  }

  if (/initial|bootstrap|setup/.test(secretName) && /admin|password|secret|credential|token/.test(secretName)) {
    return "bootstrap-credential";
  }

  if (hasControllerApiConsumptionHint(secret)) {
    return "controller-api-consumed";
  }

  return "orphan-candidate";
}

function inferExpiry(secret: KubeObjectLike): string | undefined {
  const annotations = secret.metadata?.annotations ?? {};
  const value = annotations["credential-explorer.io/expires-at"] ?? annotations["expires-at"] ?? annotations.expiry;

  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function formatExternalSecretConditions(externalSecret: ExternalSecretLike | undefined): string[] | undefined {
  if (!externalSecret) {
    return undefined;
  }

  return getExternalSecretConditions(externalSecret).map((condition) => {
    const suffix = [condition.reason, condition.message].filter(Boolean).join(" - ");

    return `${condition.type}: ${condition.status}${suffix ? ` / ${suffix}` : ""}`;
  });
}

function buildEvidence(
  usingPods: KubeObjectLike[],
  workloadTemplatesUsingSecret: WorkloadTemplateUsage[],
  serviceAccountsUsingSecret: KubeObjectLike[],
  isCredentialCandidate: boolean,
  origin: CredentialRecord["origin"],
  usageClass: CredentialRecord["usageClass"],
  externalSecret?: ExternalSecretLike
): string[] {
  const evidence: string[] = [];

  evidence.push(`Usage classification: ${getUsageClassLabel(usageClass)}`);

  if (externalSecret) {
    evidence.push(`Managed by ExternalSecret ${getObjectNamespace(externalSecret)}/${getObjectName(externalSecret)}`);
  }

  if (usingPods.length > 0) {
    evidence.push(`Referenced by ${usingPods.length} pod(s) through Pod or ServiceAccount references`);
  } else if (workloadTemplatesUsingSecret.length > 0) {
    evidence.push("No active Pod currently references this Secret");
  } else if (isCredentialCandidate) {
    evidence.push("No workload reference found in Pod env, envFrom, volumes, projected volumes, imagePullSecrets, or ServiceAccount references");
  } else {
    evidence.push(`Classified as ${origin} managed Secret, not a workload credential candidate`);
  }

  if (workloadTemplatesUsingSecret.length > 0) {
    evidence.push(
      `Referenced by workload template(s): ${workloadTemplatesUsingSecret
        .map(formatWorkloadTemplateUsage)
        .join(", ")}`
    );
  }

  if (serviceAccountsUsingSecret.length > 0) {
    evidence.push(`Referenced by ${serviceAccountsUsingSecret.length} ServiceAccount object(s)`);
  }

  return evidence;
}

function buildClusterCredentialRecords(
  secrets: KubeObjectLike[],
  pods: KubeObjectLike[],
  deployments: KubeObjectLike[],
  statefulSets: KubeObjectLike[],
  daemonSets: KubeObjectLike[],
  jobs: KubeObjectLike[],
  cronJobs: KubeObjectLike[],
  serviceAccounts: KubeObjectLike[],
  externalSecrets: ExternalSecretLike[]
): CredentialRecord[] {
  const externalSecretIndex = buildExternalSecretIndex(externalSecrets);
  const workloadTemplates: WorkloadTemplateUsage[] = [
    ...deployments.map((item) => ({ kind: "Deployment" as WorkloadTemplateKind, item })),
    ...statefulSets.map((item) => ({ kind: "StatefulSet" as WorkloadTemplateKind, item })),
    ...daemonSets.map((item) => ({ kind: "DaemonSet" as WorkloadTemplateKind, item })),
    ...jobs.map((item) => ({ kind: "Job" as WorkloadTemplateKind, item })),
    ...cronJobs.map((item) => ({ kind: "CronJob" as WorkloadTemplateKind, item }))
  ];

  return secrets.map((secret) => {
    const namespace = getObjectNamespace(secret);
    const secretName = getObjectName(secret);
    const directPods = pods.filter((pod) => getObjectNamespace(pod) === namespace && collectPodSecretReferences(pod).has(secretName));
    const workloadTemplatesUsingSecret = workloadTemplates.filter(
      (usage) =>
        getObjectNamespace(usage.item) === namespace && collectWorkloadTemplateSecretReferences(usage.item, usage.kind).has(secretName)
    );
    const serviceAccountsUsingSecret = serviceAccounts.filter(
      (serviceAccount) =>
        getObjectNamespace(serviceAccount) === namespace && collectServiceAccountSecretReferences(serviceAccount).has(secretName)
    );
    const serviceAccountNamesUsingSecret = new Set(serviceAccountsUsingSecret.map(getObjectName));
    const serviceAccountPods = pods.filter((pod) => {
      const podServiceAccount = ((pod.spec as Record<string, any> | undefined)?.serviceAccountName as string | undefined) ?? "default";

      return getObjectNamespace(pod) === namespace && serviceAccountNamesUsingSecret.has(podServiceAccount);
    });
    const usingPods = Array.from(new Map([...directPods, ...serviceAccountPods].map((pod) => [getObjectName(pod), pod])).values());
    const workloadNames = Array.from(
      new Set([
        ...usingPods.map((pod) => findDeploymentNameForPod(pod, deployments)),
        ...workloadTemplatesUsingSecret.map((usage) => `${usage.kind}/${getObjectName(usage.item)}`)
      ])
    );
    const serviceAccountNames = Array.from(
      new Set([
        ...usingPods.map((pod) => ((pod.spec as Record<string, any> | undefined)?.serviceAccountName as string | undefined) ?? "default"),
        ...workloadTemplatesUsingSecret.map((usage) => getWorkloadTemplateServiceAccountName(usage.item, usage.kind)),
        ...serviceAccountsUsingSecret.map(getObjectName)
      ])
    );
    const warnings: string[] = [];
    const externalSecret = externalSecretIndex.get(`${namespace}/${secretName}`);
    const origin = externalSecret ? "external-secrets" : inferOrigin(secret);
    const isCredentialCandidate = isWorkloadCredentialCandidate(secret, origin);
    const usageClass = inferUsageClass(secret, origin, usingPods, workloadTemplatesUsingSecret, serviceAccountsUsingSecret, externalSecret);
    const externalSecretStatus = externalSecret ? getExternalSecretStatus(externalSecret) : undefined;
    const tlsCertificate = getTlsCertificateInfo(secret);

    if (secret.type === "kubernetes.io/tls" && !tlsCertificate) {
      warnings.push("TLS certificate could not be parsed from tls.crt");
    }

    if (tlsCertificate) {
      const tlsDaysToExpiry = differenceInCalendarDays(new Date(tlsCertificate.notAfter), now);

      if (tlsDaysToExpiry < 0) {
        warnings.push(`TLS certificate expired ${Math.abs(tlsDaysToExpiry)}d ago`);
      } else if (tlsDaysToExpiry <= 30) {
        warnings.push(`TLS certificate expires in ${tlsDaysToExpiry}d`);
      }
    }

    if (externalSecretStatus && !externalSecretStatus.toLowerCase().startsWith("true")) {
      warnings.push(`ExternalSecret not ready: ${externalSecretStatus}`);
    }

    if (usageClass === "orphan-candidate" && isCredentialCandidate) {
      warnings.push("Secret orphan: no pod references found");
    }

    if (origin === "manual" && usageClass === "orphan-candidate") {
      const ageDays = differenceInCalendarDays(now, new Date(getObjectCreationTimestamp(secret, now)));

      if (ageDays >= 180) {
        warnings.push(`Manual secret older than ${ageDays}d`);
      }
    }

    return {
      secretName,
      namespace,
      secretType: secret.type ?? "Opaque",
      deploymentName: workloadNames.join(", ") || getRelationFallbackLabel(origin, usageClass),
      podNames: usingPods.map(getObjectName),
      serviceAccountName: serviceAccountNames.join(", ") || "n/a",
      createdAt: getObjectCreationTimestamp(secret, now),
      expiresAt: tlsCertificate?.notAfter ?? inferExpiry(secret),
      origin,
      usageClass,
      warnings,
      evidence: buildEvidence(
        usingPods,
        workloadTemplatesUsingSecret,
        serviceAccountsUsingSecret,
        isCredentialCandidate,
        origin,
        usageClass,
        externalSecret
      ),
      externalSecretName: externalSecret ? `${getObjectNamespace(externalSecret)}/${getObjectName(externalSecret)}` : undefined,
      externalSecretStatus,
      externalSecretMessage: externalSecret ? getExternalSecretReadyMessage(externalSecret) : undefined,
      externalSecretRefreshTime: (externalSecret?.status as Record<string, any> | undefined)?.refreshTime,
      externalSecretRefreshInterval: externalSecret ? getExternalSecretRefreshInterval(externalSecret) : undefined,
      externalSecretStore: externalSecret ? getExternalSecretStore(externalSecret) : undefined,
      externalSecretConditions: formatExternalSecretConditions(externalSecret),
      externalSecretRemoteRefs: externalSecret ? getExternalSecretRemoteRefs(externalSecret) : undefined,
      tlsSubject: tlsCertificate?.subject,
      tlsIssuer: tlsCertificate?.issuer,
      tlsSubjectAltNames: tlsCertificate?.subjectAltNames,
      tlsNotBefore: tlsCertificate?.notBefore,
      tlsNotAfter: tlsCertificate?.notAfter,
      dataKeys: Object.keys(secret.data ?? {}).sort((a, b) => a.localeCompare(b)),
      labels: secret.metadata?.labels ?? {},
      annotations: secret.metadata?.annotations ?? {},
      ownerReferences: getOwnerRefs(secret)
        .map((reference) => `${reference.kind ?? "Unknown"}/${reference.name ?? "unknown"}`)
        .sort((a, b) => a.localeCompare(b))
    };
  });
}

function computeSeverity(warnings: string[], daysToExpiry?: number): CredentialViewModel["severity"] {
  const hasCriticalWarning = warnings.some((warning) => /expired|critical/i.test(warning));

  if (hasCriticalWarning || (daysToExpiry !== undefined && daysToExpiry < 0)) {
    return "critical";
  }

  if (warnings.length > 0 || (daysToExpiry !== undefined && daysToExpiry <= 7)) {
    return "warning";
  }

  if (daysToExpiry !== undefined && daysToExpiry <= 30) {
    return "info";
  }

  return "none";
}

function toCredentialViewModel(item: CredentialRecord): CredentialViewModel {
  const created = new Date(item.createdAt);
  const ageDays = Math.max(0, differenceInCalendarDays(now, created));

  let daysToExpiry: number | undefined;

  if (item.expiresAt) {
    const expires = new Date(item.expiresAt);
    daysToExpiry = differenceInCalendarDays(expires, now);
  }

  const derivedWarnings = [...item.warnings];

  if (
    daysToExpiry !== undefined &&
    daysToExpiry >= 0 &&
    daysToExpiry <= 30 &&
    !derivedWarnings.some((warning) => /expires in/i.test(warning))
  ) {
    derivedWarnings.push(`Secret expires in ${daysToExpiry}d`);
  }

  const severity = computeSeverity(derivedWarnings, daysToExpiry);

  return {
    ...item,
    ageDays,
    daysToExpiry,
    warnings: derivedWarnings,
    severity,
    warningCount: derivedWarnings.length
  };
}

export async function loadCredentialView(): Promise<CredentialLoadResult> {
  try {
    const [secrets, pods, deployments, statefulSets, daemonSets, jobs, cronJobs, serviceAccounts, externalSecrets] = await Promise.all([
      loadSecrets(),
      loadPods(),
      loadDeployments(),
      loadStatefulSets(),
      loadDaemonSets(),
      loadJobs(),
      loadCronJobs(),
      loadServiceAccounts(),
      loadExternalSecrets()
    ]);

    debugLog("collector", "cluster stores loaded", {
      secrets: secrets.length,
      pods: pods.length,
      deployments: deployments.length,
      statefulSets: statefulSets.length,
      daemonSets: daemonSets.length,
      jobs: jobs.length,
      cronJobs: cronJobs.length,
      serviceAccounts: serviceAccounts.length,
      externalSecrets: externalSecrets.length
    });

    if (secrets.length === 0) {
      return { rows: [], source: "empty", error: "No cluster Secret loaded" };
    }

    return {
      rows: buildClusterCredentialRecords(
        secrets,
        pods,
        deployments,
        statefulSets,
        daemonSets,
        jobs,
        cronJobs,
        serviceAccounts,
        externalSecrets
      ).map(toCredentialViewModel),
      source: "cluster"
    };
  } catch (error) {
    debugLog("collector", "cluster collector failed", { error: String(error) });

    return { rows: [], source: "error", error: String(error) };
  }
}
