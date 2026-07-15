import { Renderer } from "@freelensapp/extensions";
import { debugLog } from "../common/debug";
import type { KubeObjectLike, KubeStoreLike } from "./k8s-object-utils";

class SecretKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "Secret";
  static readonly namespaced = true;
  static readonly apiBase = "/api/v1/secrets";
}

class PodKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "Pod";
  static readonly namespaced = true;
  static readonly apiBase = "/api/v1/pods";
}

class DeploymentKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "Deployment";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/apps/v1/deployments";
}

class StatefulSetKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "StatefulSet";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/apps/v1/statefulsets";
}

class DaemonSetKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "DaemonSet";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/apps/v1/daemonsets";
}

class JobKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "Job";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/batch/v1/jobs";
}

class CronJobKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "CronJob";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/batch/v1/cronjobs";
}

class ServiceAccountKubeObject extends Renderer.K8sApi.KubeObject<any, any, any> {
  static readonly kind = "ServiceAccount";
  static readonly namespaced = true;
  static readonly apiBase = "/api/v1/serviceaccounts";
}

type KubeObjectConstructor = typeof Renderer.K8sApi.KubeObject<any, any, any>;

async function loadStoreItems(store: KubeStoreLike): Promise<KubeObjectLike[]> {
  return store
    .loadAll({
      onLoadFailure: (error) => {
        debugLog("collector", "store load failure", { error: String(error) });
      }
    })
    .then(() => store.getItems?.() ?? Array.from(store.items ?? []));
}

async function loadAllNamespaces(
  label: string,
  objectConstructor: KubeObjectConstructor,
  fallbackStore?: KubeStoreLike
): Promise<KubeObjectLike[]> {
  try {
    const api = new Renderer.K8sApi.KubeApi({
      objectConstructor,
      checkPreferredVersion: false,
      autoRegister: false
    });
    const items = (await api.list({ namespace: "" })) as KubeObjectLike[];

    debugLog("collector", `${label} loaded through all-namespaces api`, {
      count: items.length,
      namespaces: Array.from(new Set(items.map((item) => item.metadata?.namespace ?? item.getNs?.() ?? "default"))).sort()
    });

    return items;
  } catch (error) {
    debugLog("collector", `${label} all-namespaces api failed, falling back to store`, { error: String(error) });

    return fallbackStore ? loadStoreItems(fallbackStore) : [];
  }
}

export function loadSecrets(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("secrets", SecretKubeObject, Renderer.K8sApi.secretsStore as KubeStoreLike);
}

export function loadPods(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("pods", PodKubeObject, Renderer.K8sApi.podsStore as KubeStoreLike);
}

export function loadDeployments(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("deployments", DeploymentKubeObject, Renderer.K8sApi.deploymentStore as KubeStoreLike);
}

export function loadStatefulSets(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("stateful sets", StatefulSetKubeObject);
}

export function loadDaemonSets(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("daemon sets", DaemonSetKubeObject);
}

export function loadJobs(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("jobs", JobKubeObject);
}

export function loadCronJobs(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("cron jobs", CronJobKubeObject);
}

export function loadServiceAccounts(): Promise<KubeObjectLike[]> {
  return loadAllNamespaces("service accounts", ServiceAccountKubeObject, Renderer.K8sApi.serviceAccountsStore as KubeStoreLike);
}
