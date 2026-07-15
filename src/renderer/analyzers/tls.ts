import { debugLog } from "../../common/debug";
import { getObjectName, getObjectNamespace, type KubeObjectLike } from "../k8s-object-utils";

export interface TlsCertificateInfo {
  subject: string;
  issuer: string;
  subjectAltNames: string[];
  notBefore: string;
  notAfter: string;
}

function parseSubjectAltNames(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

export function getTlsCertificateInfo(secret: KubeObjectLike): TlsCertificateInfo | undefined {
  const encodedCertificate = secret.data?.["tls.crt"];

  if (secret.type !== "kubernetes.io/tls" || !encodedCertificate) {
    return undefined;
  }

  try {
    const crypto = require("node:crypto") as typeof import("node:crypto");
    const certificate = new crypto.X509Certificate(Buffer.from(encodedCertificate, "base64"));

    return {
      subject: certificate.subject,
      issuer: certificate.issuer,
      subjectAltNames: parseSubjectAltNames(certificate.subjectAltName),
      notBefore: new Date(certificate.validFrom).toISOString(),
      notAfter: new Date(certificate.validTo).toISOString()
    };
  } catch (error) {
    debugLog("collector", "tls certificate parse failed", {
      secret: `${getObjectNamespace(secret)}/${getObjectName(secret)}`,
      error: String(error)
    });

    return undefined;
  }
}
