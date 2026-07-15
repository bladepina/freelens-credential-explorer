export type KubeObjectLike = {
  type?: string;
  data?: Record<string, string>;
  spec?: Record<string, unknown>;
  status?: Record<string, unknown>;
  metadata?: {
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: Array<{ apiVersion?: string; kind?: string; name?: string }>;
  };
  getName?: () => string;
  getNs?: () => string;
  getCreationTimestamp?: () => number;
  getOwnerRefs?: () => Array<{ apiVersion?: string; kind?: string; name?: string }>;
};

export type KubeStoreLike = {
  loadAll: (params?: { onLoadFailure?: (error: unknown) => void }) => Promise<unknown>;
  getItems?: () => KubeObjectLike[];
  items?: KubeObjectLike[];
};

export const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function getObjectName(item: KubeObjectLike): string {
  return item.getName?.() ?? item.metadata?.name ?? "unknown";
}

export function getObjectNamespace(item: KubeObjectLike): string {
  return item.getNs?.() ?? item.metadata?.namespace ?? "default";
}

export function getObjectCreationTimestamp(item: KubeObjectLike, fallback: Date): string {
  const timestamp = item.getCreationTimestamp?.();

  if (timestamp !== undefined) {
    return new Date(timestamp).toISOString();
  }

  return item.metadata?.creationTimestamp ?? fallback.toISOString();
}

export function getOwnerRefs(item: KubeObjectLike): Array<{ apiVersion?: string; kind?: string; name?: string }> {
  return item.getOwnerRefs?.() ?? item.metadata?.ownerReferences ?? [];
}

export function differenceInCalendarDays(left: Date, right: Date): number {
  const leftUtc = Date.UTC(left.getUTCFullYear(), left.getUTCMonth(), left.getUTCDate());
  const rightUtc = Date.UTC(right.getUTCFullYear(), right.getUTCMonth(), right.getUTCDate());

  return Math.round((leftUtc - rightUtc) / millisecondsPerDay);
}

export function addSecretName(target: Set<string>, value: unknown): void {
  if (typeof value === "string" && value.length > 0) {
    target.add(value);
  }
}
