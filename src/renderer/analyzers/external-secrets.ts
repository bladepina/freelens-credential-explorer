import { Renderer } from "@freelensapp/extensions";
import { debugLog } from "../../common/debug";
import { getObjectName, getObjectNamespace, type KubeObjectLike } from "../k8s-object-utils";

export type ExternalSecretLike = KubeObjectLike;

export interface ExternalSecretConditionInfo {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

class ExternalSecretKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "ExternalSecret";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/external-secrets.io/v1beta1/externalsecrets";
}

export async function loadExternalSecrets(): Promise<ExternalSecretLike[]> {
  try {
    const api = new Renderer.K8sApi.KubeApi<ExternalSecretKubeObject>({
      objectConstructor: ExternalSecretKubeObject,
      fallbackApiBases: ["/apis/external-secrets.io/v1/externalsecrets"],
      checkPreferredVersion: true,
      autoRegister: false
    });
    const items = await api.list({ namespace: "" });

    debugLog("collector", "external secrets loaded", { externalSecrets: items?.length ?? 0 });

    return (items ?? []) as ExternalSecretLike[];
  } catch (error) {
    debugLog("collector", "external secrets unavailable", { error: String(error) });

    return [];
  }
}

export function getExternalSecretTargetName(externalSecret: ExternalSecretLike): string {
  const spec = externalSecret.spec as Record<string, any> | undefined;

  return spec?.target?.name ?? getObjectName(externalSecret);
}

export function getExternalSecretConditions(externalSecret: ExternalSecretLike): ExternalSecretConditionInfo[] {
  const status = externalSecret.status as Record<string, any> | undefined;

  return (status?.conditions ?? [])
    .map((condition: Record<string, unknown>) => ({
      type: String(condition.type ?? "Unknown"),
      status: String(condition.status ?? "Unknown"),
      reason: typeof condition.reason === "string" ? condition.reason : undefined,
      message: typeof condition.message === "string" ? condition.message : undefined
    }))
    .sort((left, right) => left.type.localeCompare(right.type));
}

export function getExternalSecretStatus(externalSecret: ExternalSecretLike): string {
  const readyCondition = getExternalSecretConditions(externalSecret).find((condition) => condition.type === "Ready");

  if (!readyCondition) {
    return "Unknown";
  }

  return [readyCondition.status, readyCondition.reason].filter(Boolean).join(" / ") || "Unknown";
}

export function getExternalSecretReadyMessage(externalSecret: ExternalSecretLike): string | undefined {
  return getExternalSecretConditions(externalSecret).find((condition) => condition.type === "Ready")?.message;
}

export function getExternalSecretStore(externalSecret: ExternalSecretLike): string | undefined {
  const spec = externalSecret.spec as Record<string, any> | undefined;
  const reference = spec?.secretStoreRef;

  if (!reference?.name) {
    return undefined;
  }

  return `${reference.kind ?? "SecretStore"}/${reference.name}`;
}

export function getExternalSecretRefreshInterval(externalSecret: ExternalSecretLike): string | undefined {
  const spec = externalSecret.spec as Record<string, any> | undefined;

  return typeof spec?.refreshInterval === "string" ? spec.refreshInterval : undefined;
}

export function getExternalSecretRemoteRefs(externalSecret: ExternalSecretLike): string[] {
  const spec = externalSecret.spec as Record<string, any> | undefined;
  const refs: string[] = [];

  for (const item of spec?.data ?? []) {
    const secretKey = item?.secretKey ?? "unknown-key";
    const remoteKey = item?.remoteRef?.key ?? "unknown-remote";
    const property = item?.remoteRef?.property ? `#${item.remoteRef.property}` : "";

    refs.push(`${secretKey} <- ${remoteKey}${property}`);
  }

  for (const item of spec?.dataFrom ?? []) {
    if (item?.extract?.key) {
      refs.push(`dataFrom.extract <- ${item.extract.key}`);
    } else if (item?.find) {
      refs.push("dataFrom.find <- selector");
    } else if (item?.sourceRef?.generatorRef?.name) {
      refs.push(`dataFrom.generator <- ${item.sourceRef.generatorRef.name}`);
    }
  }

  return refs.sort((left, right) => left.localeCompare(right));
}

export function buildExternalSecretIndex(externalSecrets: ExternalSecretLike[]): Map<string, ExternalSecretLike> {
  return new Map(
    externalSecrets.map((externalSecret) => [
      `${getObjectNamespace(externalSecret)}/${getExternalSecretTargetName(externalSecret)}`,
      externalSecret
    ])
  );
}
