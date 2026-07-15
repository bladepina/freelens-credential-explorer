export type SecretOrigin = "vault" | "external-secrets" | "argocd" | "cert-manager" | "manual" | "helm" | "kubernetes";
export type SecretUsageClass =
  | "workload-referenced"
  | "controller-api-consumed"
  | "operator-managed"
  | "bootstrap-credential"
  | "platform-technical"
  | "orphan-candidate";
export type WarningSeverity = "none" | "info" | "warning" | "critical";

export interface CredentialRecord {
  secretName: string;
  namespace: string;
  secretType?: string;
  deploymentName: string;
  podNames: string[];
  serviceAccountName: string;
  createdAt: string;
  expiresAt?: string;
  origin: SecretOrigin;
  usageClass: SecretUsageClass;
  warnings: string[];
  evidence?: string[];
  externalSecretName?: string;
  externalSecretStatus?: string;
  externalSecretMessage?: string;
  externalSecretRefreshTime?: string;
  externalSecretRefreshInterval?: string;
  externalSecretStore?: string;
  externalSecretConditions?: string[];
  externalSecretRemoteRefs?: string[];
  tlsSubject?: string;
  tlsIssuer?: string;
  tlsSubjectAltNames?: string[];
  tlsNotBefore?: string;
  tlsNotAfter?: string;
  dataKeys?: string[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  ownerReferences?: string[];
}

export interface CredentialViewModel extends CredentialRecord {
  ageDays: number;
  daysToExpiry?: number;
  severity: WarningSeverity;
  warningCount: number;
}
