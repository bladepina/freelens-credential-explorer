import { addSecretName, getObjectName, getObjectNamespace, getOwnerRefs, type KubeObjectLike } from "../k8s-object-utils";

export type WorkloadTemplateKind = "Deployment" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob";

export interface WorkloadTemplateUsage {
  kind: WorkloadTemplateKind;
  item: KubeObjectLike;
}

export function collectPodSecretReferences(pod: KubeObjectLike): Set<string> {
  const references = new Set<string>();
  const spec = pod.spec as Record<string, any> | undefined;

  for (const imagePullSecret of spec?.imagePullSecrets ?? []) {
    addSecretName(references, imagePullSecret?.name);
  }

  for (const volume of spec?.volumes ?? []) {
    addSecretName(references, volume?.secret?.secretName);
    addSecretName(references, volume?.azureFile?.secretName);
    addSecretName(references, volume?.cephfs?.secretRef?.name);
    addSecretName(references, volume?.cinder?.secretRef?.name);
    addSecretName(references, volume?.flexVolume?.secretRef?.name);

    for (const source of volume?.projected?.sources ?? []) {
      addSecretName(references, source?.secret?.name);
    }
  }

  for (const container of [
    ...(spec?.containers ?? []),
    ...(spec?.initContainers ?? []),
    ...(spec?.ephemeralContainers ?? [])
  ]) {
    for (const envFrom of container?.envFrom ?? []) {
      addSecretName(references, envFrom?.secretRef?.name);
    }

    for (const env of container?.env ?? []) {
      addSecretName(references, env?.valueFrom?.secretKeyRef?.name);
    }
  }

  return references;
}

function getWorkloadTemplateSpec(workload: KubeObjectLike, kind: WorkloadTemplateKind): Record<string, any> {
  const spec = workload.spec as Record<string, any> | undefined;

  if (kind === "CronJob") {
    return (spec?.jobTemplate?.spec?.template?.spec ?? {}) as Record<string, any>;
  }

  return (spec?.template?.spec ?? {}) as Record<string, any>;
}

export function collectWorkloadTemplateSecretReferences(workload: KubeObjectLike, kind: WorkloadTemplateKind): Set<string> {
  const templateSpec = getWorkloadTemplateSpec(workload, kind);

  return collectPodSecretReferences({
    metadata: workload.metadata,
    spec: templateSpec
  });
}

export function getWorkloadTemplateServiceAccountName(workload: KubeObjectLike, kind: WorkloadTemplateKind): string {
  const templateSpec = getWorkloadTemplateSpec(workload, kind);

  return typeof templateSpec.serviceAccountName === "string" ? templateSpec.serviceAccountName : "default";
}

export function formatWorkloadTemplateUsage(usage: WorkloadTemplateUsage): string {
  const spec = usage.item.spec as Record<string, any> | undefined;
  const name = `${usage.kind}/${getObjectName(usage.item)}`;

  if (usage.kind === "Deployment" || usage.kind === "StatefulSet") {
    const replicas = typeof spec?.replicas === "number" ? spec.replicas : 1;

    return `${name} (replicas: ${replicas})`;
  }

  if (usage.kind === "DaemonSet") {
    return name;
  }

  if (usage.kind === "Job") {
    const succeeded = typeof (usage.item.status as Record<string, any> | undefined)?.succeeded === "number"
      ? (usage.item.status as Record<string, any>).succeeded
      : 0;

    return `${name} (succeeded: ${succeeded})`;
  }

  const suspended = spec?.suspend === true;

  return `${name}${suspended ? " (suspended)" : ""}`;
}

export function collectServiceAccountSecretReferences(serviceAccount: KubeObjectLike): Set<string> {
  const references = new Set<string>();

  for (const imagePullSecret of (serviceAccount as Record<string, any>).imagePullSecrets ?? []) {
    addSecretName(references, imagePullSecret?.name);
  }

  for (const secret of (serviceAccount as Record<string, any>).secrets ?? []) {
    addSecretName(references, secret?.name);
  }

  return references;
}

export function deploymentOwnsPod(deployment: KubeObjectLike, pod: KubeObjectLike): boolean {
  if (getObjectNamespace(deployment) !== getObjectNamespace(pod)) {
    return false;
  }

  const selector = (deployment.spec as Record<string, any> | undefined)?.selector?.matchLabels as Record<string, string> | undefined;
  const labels = pod.metadata?.labels ?? {};

  return selector !== undefined && Object.entries(selector).every(([key, value]) => labels[key] === value);
}

export function findDeploymentNameForPod(pod: KubeObjectLike, deployments: KubeObjectLike[]): string {
  const deployment = deployments.find((item) => deploymentOwnsPod(item, pod));

  if (deployment) {
    return getObjectName(deployment);
  }

  const owner = getOwnerRefs(pod).find((reference) => reference.kind && reference.name);

  return owner?.name ?? "pod diretto";
}
