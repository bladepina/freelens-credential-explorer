import React from "react";
import type { CredentialViewModel, WarningSeverity } from "@common/types";
import { debugLog } from "../common/debug";
import { loadCredentialView } from "./credential-store";

const styles = {
  page: {
    padding: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12
  },
  loadingPanel: {
    minHeight: 280,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "var(--textColorPrimary)"
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 700
  },
  loadingSubtitle: {
    color: "var(--textColorSecondary)",
    fontSize: 13
  },
  title: {
    fontSize: 20,
    fontWeight: 700
  },
  subtitle: {
    color: "var(--textColorSecondary)",
    fontSize: 13
  },
  status: {
    color: "var(--textColorSecondary)",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "3px solid var(--borderColor)",
    borderTopColor: "var(--colorInfo)",
    animation: "credential-explorer-spin 0.8s linear infinite"
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "2fr repeat(7, 1fr)",
    gap: 8,
    alignItems: "end"
  },
  control: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4
  },
  label: {
    fontSize: 12,
    color: "var(--textColorSecondary)"
  },
  input: {
    border: "1px solid var(--borderColor)",
    borderRadius: 6,
    padding: "6px 8px",
    background: "var(--layoutBackground)",
    color: "var(--textColorPrimary)",
    fontSize: 12
  },
  counters: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
    gap: 8
  },
  counter: {
    border: "1px solid var(--borderColor)",
    borderRadius: 6,
    padding: "8px 10px",
    background: "var(--layoutBackground)",
    minWidth: 0
  },
  counterLabel: {
    color: "var(--textColorSecondary)",
    fontSize: 11,
    whiteSpace: "nowrap" as const
  },
  counterValue: {
    fontSize: 18,
    fontWeight: 700,
    marginTop: 2
  },
  content: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: 16,
    alignItems: "start",
    minHeight: 0
  },
  tableWrap: {
    minWidth: 0,
    maxHeight: "calc(100vh - 230px)",
    overflow: "auto" as const,
    borderBottom: "1px solid var(--borderColor)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13
  },
  headerCell: {
    textAlign: "left" as const,
    borderBottom: "1px solid var(--borderColor)",
    padding: "8px 10px",
    whiteSpace: "nowrap" as const,
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
    background: "var(--layoutBackground)"
  },
  cell: {
    borderBottom: "1px solid var(--borderColor)",
    padding: "8px 10px",
    verticalAlign: "top" as const
  },
  row: {
    cursor: "pointer"
  },
  selectedRow: {
    background: "var(--mainBackground)"
  },
  detailPanel: {
    border: "1px solid var(--borderColor)",
    borderRadius: 6,
    padding: 12,
    background: "var(--layoutBackground)",
    position: "sticky" as const,
    top: 12,
    maxHeight: "calc(100vh - 48px)",
    overflowY: "auto" as const
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "start"
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 700,
    wordBreak: "break-word" as const
  },
  closeButton: {
    border: "1px solid var(--borderColor)",
    borderRadius: 6,
    background: "var(--mainBackground)",
    color: "var(--textColorPrimary)",
    cursor: "pointer",
    padding: "4px 8px"
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  refreshButton: {
    border: "1px solid var(--borderColor)",
    borderRadius: 6,
    background: "var(--mainBackground)",
    color: "var(--textColorPrimary)",
    cursor: "pointer",
    padding: "6px 10px",
    fontSize: 12
  },
  refreshButtonDisabled: {
    cursor: "default",
    opacity: 0.65
  },
  detailSection: {
    borderTop: "1px solid var(--borderColor)",
    marginTop: 12,
    paddingTop: 12
  },
  detailSectionTitle: {
    color: "var(--textColorSecondary)",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase" as const
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "110px minmax(0, 1fr)",
    gap: "6px 10px",
    fontSize: 12
  },
  detailKey: {
    color: "var(--textColorSecondary)"
  },
  detailValue: {
    wordBreak: "break-word" as const
  },
  detailList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 12
  },
  emptyDetail: {
    color: "var(--textColorSecondary)",
    fontSize: 12
  },
  smallSpinner: {
    display: "inline-block",
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "2px solid var(--borderColor)",
    borderTopColor: "var(--colorInfo)",
    animation: "credential-explorer-spin 0.8s linear infinite",
    verticalAlign: "-2px",
    marginRight: 6
  },
  warning: {
    color: "var(--colorError)"
  },
  ok: {
    color: "var(--colorSuccess)"
  },
  chain: {
    fontFamily: "monospace",
    fontSize: 12,
    opacity: 0.9
  },
  badge: {
    display: "inline-block",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const
  },
  badgeNone: {
    color: "var(--textColorSecondary)",
    background: "var(--mainBackground)"
  },
  badgeInfo: {
    color: "#0f4c81",
    background: "#d7ecff"
  },
  badgeWarning: {
    color: "#7a3e00",
    background: "#ffe8c4"
  },
  badgeCritical: {
    color: "#8a0f1b",
    background: "#ffd9dc"
  }
};

type SortKey = "secret" | "namespace" | "age" | "expiry" | "severity";
type SortDir = "asc" | "desc";
type ViewFilter = "findings" | "workload" | "all";
type FindingTypeFilter = "all" | "orphans" | "manual-old" | "external-secret" | "tls-expired" | "tls-expiring" | "parse-errors";

const severityRank: Record<WarningSeverity, number> = {
  none: 0,
  info: 1,
  warning: 2,
  critical: 3
};

function severityLabel(value: WarningSeverity): string {
  return value.toUpperCase();
}

function severityBadgeStyle(value: WarningSeverity): React.CSSProperties {
  if (value === "critical") {
    return { ...styles.badge, ...styles.badgeCritical };
  }

  if (value === "warning") {
    return { ...styles.badge, ...styles.badgeWarning };
  }

  if (value === "info") {
    return { ...styles.badge, ...styles.badgeInfo };
  }

  return { ...styles.badge, ...styles.badgeNone };
}

function formatOrigin(value: string): string {
  if (value === "external-secrets") {
    return "External Secrets";
  }

  if (value === "argocd") {
    return "ArgoCD";
  }

  if (value === "cert-manager") {
    return "cert-manager";
  }

  if (value === "vault") {
    return "Vault";
  }

  if (value === "helm") {
    return "Helm";
  }

  if (value === "kubernetes") {
    return "Kubernetes";
  }

  return "Manuale";
}

function formatExpiry(daysToExpiry?: number): string {
  if (daysToExpiry === undefined) {
    return "n/a";
  }

  if (daysToExpiry < 0) {
    return `scaduto da ${Math.abs(daysToExpiry)}g`;
  }

  return `${daysToExpiry}g`;
}

function credentialKey(row: CredentialViewModel): string {
  return `${row.namespace}/${row.secretName}`;
}

function formatRecord(value?: Record<string, string>): string[] {
  return Object.entries(value ?? {})
    .map(([key, item]) => `${key}: ${item}`)
    .sort((left, right) => left.localeCompare(right));
}

function renderDetailList(items: string[] | undefined, emptyText: string): JSX.Element {
  if (!items || items.length === 0) {
    return <div style={styles.emptyDetail}>{emptyText}</div>;
  }

  return (
    <ul style={styles.detailList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function hasWarning(row: CredentialViewModel, pattern: RegExp): boolean {
  return row.warnings.some((warning) => pattern.test(warning));
}

function hasFindingType(row: CredentialViewModel, findingType: FindingTypeFilter): boolean {
  if (findingType === "all") {
    return row.severity !== "none";
  }

  if (findingType === "orphans") {
    return hasWarning(row, /secret orphan/i);
  }

  if (findingType === "manual-old") {
    return hasWarning(row, /manual secret older/i);
  }

  if (findingType === "external-secret") {
    return hasWarning(row, /externalsecret not ready/i);
  }

  if (findingType === "tls-expired") {
    return hasWarning(row, /tls certificate expired/i);
  }

  if (findingType === "tls-expiring") {
    return hasWarning(row, /tls certificate expires in/i);
  }

  return hasWarning(row, /could not be parsed|parse failed/i);
}

function countRows(rows: CredentialViewModel[], predicate: (row: CredentialViewModel) => boolean): number {
  return rows.filter(predicate).length;
}

export function CredentialExplorerPage(): JSX.Element {
  debugLog("page", "render start");

  const [rows, setRows] = React.useState<CredentialViewModel[]>([]);
  const [dataSource, setDataSource] = React.useState<"loading" | "cluster" | "empty" | "error">("loading");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string>();
  const [query, setQuery] = React.useState("");
  const [viewFilter, setViewFilter] = React.useState<ViewFilter>("findings");
  const [findingTypeFilter, setFindingTypeFilter] = React.useState<FindingTypeFilter>("all");
  const [namespaceFilter, setNamespaceFilter] = React.useState("all");
  const [originFilter, setOriginFilter] = React.useState("all");
  const [severityFilter, setSeverityFilter] = React.useState<WarningSeverity | "all">("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("severity");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [selectedRowKey, setSelectedRowKey] = React.useState<string>();

  const reload = React.useCallback((showInitialLoading: boolean) => {
    if (showInitialLoading) {
      setDataSource("loading");
    } else {
      setIsRefreshing(true);
    }

    loadCredentialView()
      .then((result) => {
        setRows(result.rows);
        setDataSource(result.source);
        setLoadError(result.error);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  React.useEffect(() => {
    reload(true);
  }, [reload]);

  const namespaces = React.useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.namespace))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const counters = React.useMemo(() => {
    return {
      critical: countRows(rows, (row) => row.severity === "critical"),
      warnings: countRows(rows, (row) => row.severity === "warning"),
      orphans: countRows(rows, (row) => hasFindingType(row, "orphans")),
      externalSecrets: countRows(rows, (row) => hasFindingType(row, "external-secret")),
      tls: countRows(rows, (row) => hasFindingType(row, "tls-expired") || hasFindingType(row, "tls-expiring")),
      manualOld: countRows(rows, (row) => hasFindingType(row, "manual-old"))
    };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows
      .filter((row) => {
        const text = `${row.secretName} ${row.deploymentName} ${row.serviceAccountName} ${row.namespace}`.toLowerCase();
        const matchesQuery = query.trim().length === 0 || text.includes(query.toLowerCase());
        const matchesNamespace = namespaceFilter === "all" || row.namespace === namespaceFilter;
        const matchesOrigin = originFilter === "all" || row.origin === originFilter;
        const matchesSeverity = severityFilter === "all" || row.severity === severityFilter;
        const matchesFindingType = findingTypeFilter === "all" || hasFindingType(row, findingTypeFilter);
        const matchesView =
          viewFilter === "all" ||
          (viewFilter === "findings" && row.severity !== "none") ||
          (viewFilter === "workload" && row.origin !== "helm" && row.origin !== "kubernetes");

        return matchesQuery && matchesView && matchesFindingType && matchesNamespace && matchesOrigin && matchesSeverity;
      })
      .sort((left, right) => {
        let value = 0;

        if (sortKey === "secret") {
          value = left.secretName.localeCompare(right.secretName);
        } else if (sortKey === "namespace") {
          value = left.namespace.localeCompare(right.namespace);
        } else if (sortKey === "age") {
          value = left.ageDays - right.ageDays;
        } else if (sortKey === "expiry") {
          const leftExpiry = left.daysToExpiry ?? Number.POSITIVE_INFINITY;
          const rightExpiry = right.daysToExpiry ?? Number.POSITIVE_INFINITY;
          value = leftExpiry - rightExpiry;
        } else if (sortKey === "severity") {
          value = severityRank[left.severity] - severityRank[right.severity];
        }

        return sortDir === "asc" ? value : value * -1;
      });
  }, [rows, query, viewFilter, findingTypeFilter, namespaceFilter, originFilter, severityFilter, sortKey, sortDir]);

  const selectedRow = React.useMemo(() => {
    return rows.find((row) => credentialKey(row) === selectedRowKey);
  }, [rows, selectedRowKey]);

  if (dataSource === "loading") {
    return (
      <section style={styles.page}>
        <style>{"@keyframes credential-explorer-spin { to { transform: rotate(360deg); } }"}</style>
        <div style={styles.loadingPanel}>
          <span aria-hidden="true" style={styles.spinner} />
          <div style={styles.loadingTitle}>Loading Credential data</div>
          <div style={styles.loadingSubtitle}>Discovering Secrets, workloads, Pods, and ServiceAccounts...</div>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <style>{"@keyframes credential-explorer-spin { to { transform: rotate(360deg); } }"}</style>
      <div style={styles.toolbar}>
        <h2 style={styles.title}>Credential Explorer</h2>
        <button
          style={isRefreshing ? { ...styles.refreshButton, ...styles.refreshButtonDisabled } : styles.refreshButton}
          type="button"
          disabled={isRefreshing}
          onClick={() => reload(false)}
        >
          {isRefreshing ? <span aria-hidden="true" style={styles.smallSpinner} /> : null}
          Refresh
        </button>
      </div>
      <p style={styles.subtitle}>
        Quick view: Secret {"->"} Deployment {"->"} Pods {"->"} ServiceAccount
      </p>
      <div style={styles.status}>
        {dataSource === "cluster"
            ? "Real-time cluster data"
            : dataSource === "empty"
              ? "No Secrets loaded from cluster"
              : "Error loading cluster API"}
        {loadError ? ` (${loadError})` : ""}
      </div>

      <div style={styles.counters}>
        <div style={styles.counter}>
          <div style={styles.counterLabel}>Critical</div>
          <div style={styles.counterValue}>{counters.critical}</div>
        </div>
        <div style={styles.counter}>
          <div style={styles.counterLabel}>Warnings</div>
          <div style={styles.counterValue}>{counters.warnings}</div>
        </div>
        <div style={styles.counter}>
          <div style={styles.counterLabel}>Orphans</div>
          <div style={styles.counterValue}>{counters.orphans}</div>
        </div>
        <div style={styles.counter}>
          <div style={styles.counterLabel}>ESO issues</div>
          <div style={styles.counterValue}>{counters.externalSecrets}</div>
        </div>
        <div style={styles.counter}>
          <div style={styles.counterLabel}>TLS issues</div>
          <div style={styles.counterValue}>{counters.tls}</div>
        </div>
        <div style={styles.counter}>
          <div style={styles.counterLabel}>Manual old</div>
          <div style={styles.counterValue}>{counters.manualOld}</div>
        </div>
      </div>

      <div style={styles.controls}>
        <label style={styles.control}>
          <span style={styles.label}>Search</span>
          <input
            style={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="secret, deployment, serviceaccount..."
          />
        </label>

        <label style={styles.control}>
          <span style={styles.label}>Vista</span>
          <select style={styles.input} value={viewFilter} onChange={(event) => setViewFilter(event.target.value as ViewFilter)}>
            <option value="findings">Findings</option>
            <option value="workload">Workload credentials</option>
            <option value="all">All</option>
          </select>
        </label>

        <label style={styles.control}>
          <span style={styles.label}>Finding</span>
          <select
            style={styles.input}
            value={findingTypeFilter}
            onChange={(event) => setFindingTypeFilter(event.target.value as FindingTypeFilter)}
          >
            <option value="all">All findings</option>
            <option value="orphans">Orphans</option>
            <option value="manual-old">Manual old</option>
            <option value="external-secret">ExternalSecret not ready</option>
            <option value="tls-expired">TLS expired</option>
            <option value="tls-expiring">TLS expiring</option>
            <option value="parse-errors">Parse errors</option>
          </select>
        </label>

        <label style={styles.control}>
          <span style={styles.label}>Namespace</span>
          <select
            style={styles.input}
            value={namespaceFilter}
            onChange={(event) => setNamespaceFilter(event.target.value)}
          >
            <option value="all">All</option>
            {namespaces.map((namespace) => (
              <option key={namespace} value={namespace}>
                {namespace}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.control}>
          <span style={styles.label}>Origine</span>
          <select style={styles.input} value={originFilter} onChange={(event) => setOriginFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="vault">Vault</option>
            <option value="external-secrets">External Secrets</option>
            <option value="argocd">ArgoCD</option>
            <option value="cert-manager">cert-manager</option>
            <option value="manual">Manuale</option>
            <option value="helm">Helm</option>
            <option value="kubernetes">Kubernetes</option>
          </select>
        </label>

        <label style={styles.control}>
          <span style={styles.label}>Severity</span>
          <select
            style={styles.input}
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as WarningSeverity | "all")}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="none">None</option>
          </select>
        </label>

        <label style={styles.control}>
          <span style={styles.label}>Sort by</span>
          <select style={styles.input} value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="severity">Severity</option>
            <option value="expiry">Scadenza</option>
            <option value="age">Age</option>
            <option value="namespace">Namespace</option>
            <option value="secret">Secret</option>
          </select>
        </label>

        <label style={styles.control}>
          <span style={styles.label}>Order</span>
          <select style={styles.input} value={sortDir} onChange={(event) => setSortDir(event.target.value as SortDir)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>
      </div>

      <div style={styles.content}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.headerCell}>Secret</th>
                <th style={styles.headerCell}>Age</th>
                <th style={styles.headerCell}>Scadenza</th>
                <th style={styles.headerCell}>Namespace</th>
                <th style={styles.headerCell}>Origine</th>
                <th style={styles.headerCell}>Severity</th>
                <th style={styles.headerCell}>Relazione</th>
                <th style={styles.headerCell}>Warning</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td style={styles.cell} colSpan={8}>
                    Nessun risultato per i filtri selezionati.
                  </td>
                </tr>
              ) : null}
              {filteredRows.map((row) => {
                const hasWarnings = row.warnings.length > 0;
                const isSelected = credentialKey(row) === selectedRowKey;

                return (
                  <tr
                    key={credentialKey(row)}
                    style={isSelected ? { ...styles.row, ...styles.selectedRow } : styles.row}
                    onClick={() => setSelectedRowKey(credentialKey(row))}
                  >
                    <td style={styles.cell}>{row.secretName}</td>
                    <td style={styles.cell}>{row.ageDays}g</td>
                    <td style={styles.cell}>{formatExpiry(row.daysToExpiry)}</td>
                    <td style={styles.cell}>{row.namespace}</td>
                    <td style={styles.cell}>{formatOrigin(row.origin)}</td>
                    <td style={styles.cell}>
                      <span style={severityBadgeStyle(row.severity)}>{severityLabel(row.severity)}</span>
                    </td>
                    <td style={styles.cell}>
                      <div style={styles.chain}>
                        {row.secretName} {"->"} {row.deploymentName} {"->"} {row.podNames.join(", ") || "no pods"} {"->"} {row.serviceAccountName}
                      </div>
                    </td>
                    <td style={styles.cell}>
                      <span style={hasWarnings ? styles.warning : styles.ok}>
                        {hasWarnings ? row.warnings.join("; ") : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside style={styles.detailPanel}>
          {selectedRow ? (
            <>
              <div style={styles.detailHeader}>
                <div>
                  <div style={styles.detailTitle}>{selectedRow.secretName}</div>
                  <div style={styles.status}>{selectedRow.namespace}</div>
                </div>
                <button style={styles.closeButton} type="button" onClick={() => setSelectedRowKey(undefined)}>
                  Close
                </button>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Summary</div>
                <div style={styles.detailGrid}>
                  <span style={styles.detailKey}>Severity</span>
                  <span style={styles.detailValue}><span style={severityBadgeStyle(selectedRow.severity)}>{severityLabel(selectedRow.severity)}</span></span>
                  <span style={styles.detailKey}>Origin</span>
                  <span style={styles.detailValue}>{formatOrigin(selectedRow.origin)}</span>
                  <span style={styles.detailKey}>Usage</span>
                  <span style={styles.detailValue}>{selectedRow.usageClass}</span>
                  <span style={styles.detailKey}>ExternalSecret</span>
                  <span style={styles.detailValue}>{selectedRow.externalSecretName ?? "n/a"}</span>
                  <span style={styles.detailKey}>ESO Status</span>
                  <span style={styles.detailValue}>{selectedRow.externalSecretStatus ?? "n/a"}</span>
                  <span style={styles.detailKey}>ESO Message</span>
                  <span style={styles.detailValue}>{selectedRow.externalSecretMessage ?? "n/a"}</span>
                  <span style={styles.detailKey}>SecretStore</span>
                  <span style={styles.detailValue}>{selectedRow.externalSecretStore ?? "n/a"}</span>
                  <span style={styles.detailKey}>Refresh</span>
                  <span style={styles.detailValue}>{selectedRow.externalSecretRefreshInterval ?? "n/a"}</span>
                  <span style={styles.detailKey}>Last Refresh</span>
                  <span style={styles.detailValue}>{selectedRow.externalSecretRefreshTime ?? "n/a"}</span>
                  <span style={styles.detailKey}>Type</span>
                  <span style={styles.detailValue}>{selectedRow.secretType ?? "Opaque"}</span>
                  <span style={styles.detailKey}>Age</span>
                  <span style={styles.detailValue}>{selectedRow.ageDays}g</span>
                  <span style={styles.detailKey}>Expiry</span>
                  <span style={styles.detailValue}>{formatExpiry(selectedRow.daysToExpiry)}</span>
                  <span style={styles.detailKey}>Created</span>
                  <span style={styles.detailValue}>{new Date(selectedRow.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedRow.externalSecretName ? (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>External Secrets Operator</div>
                  <div style={styles.detailGrid}>
                    <span style={styles.detailKey}>ExternalSecret</span>
                    <span style={styles.detailValue}>{selectedRow.externalSecretName}</span>
                    <span style={styles.detailKey}>SecretStore</span>
                    <span style={styles.detailValue}>{selectedRow.externalSecretStore ?? "n/a"}</span>
                    <span style={styles.detailKey}>Status</span>
                    <span style={styles.detailValue}>{selectedRow.externalSecretStatus ?? "n/a"}</span>
                    <span style={styles.detailKey}>Message</span>
                    <span style={styles.detailValue}>{selectedRow.externalSecretMessage ?? "n/a"}</span>
                    <span style={styles.detailKey}>Refresh</span>
                    <span style={styles.detailValue}>{selectedRow.externalSecretRefreshInterval ?? "n/a"}</span>
                    <span style={styles.detailKey}>Last Refresh</span>
                    <span style={styles.detailValue}>{selectedRow.externalSecretRefreshTime ?? "n/a"}</span>
                  </div>
                  <div style={styles.detailSection}>
                    <div style={styles.detailSectionTitle}>ESO Conditions</div>
                    {renderDetailList(selectedRow.externalSecretConditions, "No ExternalSecret conditions loaded")}
                  </div>
                  <div style={styles.detailSection}>
                    <div style={styles.detailSectionTitle}>ESO Remote Refs</div>
                    {renderDetailList(selectedRow.externalSecretRemoteRefs, "No ExternalSecret data mappings loaded")}
                  </div>
                </div>
              ) : null}

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Credential Chain</div>
                <div style={styles.chain}>
                  {selectedRow.secretName} {"->"} {selectedRow.deploymentName} {"->"} {selectedRow.podNames.join(", ") || "no pods"} {"->"} {selectedRow.serviceAccountName}
                </div>
              </div>

              {selectedRow.secretType === "kubernetes.io/tls" ? (
                <div style={styles.detailSection}>
                  <div style={styles.detailSectionTitle}>TLS Certificate</div>
                  <div style={styles.detailGrid}>
                    <span style={styles.detailKey}>Subject</span>
                    <span style={styles.detailValue}>{selectedRow.tlsSubject ?? "n/a"}</span>
                    <span style={styles.detailKey}>Issuer</span>
                    <span style={styles.detailValue}>{selectedRow.tlsIssuer ?? "n/a"}</span>
                    <span style={styles.detailKey}>Not Before</span>
                    <span style={styles.detailValue}>{selectedRow.tlsNotBefore ?? "n/a"}</span>
                    <span style={styles.detailKey}>Not After</span>
                    <span style={styles.detailValue}>{selectedRow.tlsNotAfter ?? "n/a"}</span>
                  </div>
                  <div style={styles.detailSection}>
                    <div style={styles.detailSectionTitle}>Subject Alt Names</div>
                    {renderDetailList(selectedRow.tlsSubjectAltNames, "No SAN entries parsed")}
                  </div>
                </div>
              ) : null}

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Warnings</div>
                {renderDetailList(selectedRow.warnings, "No active warning")}
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Evidence</div>
                {renderDetailList(selectedRow.evidence, "No evidence recorded")}
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Secret Data Keys</div>
                {renderDetailList(selectedRow.dataKeys, "No data keys visible")}
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Owner References</div>
                {renderDetailList(selectedRow.ownerReferences, "No owner references")}
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Labels</div>
                {renderDetailList(formatRecord(selectedRow.labels), "No labels")}
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Annotations</div>
                {renderDetailList(formatRecord(selectedRow.annotations), "No annotations")}
              </div>
            </>
          ) : (
            <div style={styles.emptyDetail}>Seleziona un Secret dalla tabella per vedere dettagli, evidence e metadati.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
