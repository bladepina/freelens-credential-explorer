# Release Notes

## [0.1.0] - 2026-07-15

### ✨ Features
- Initial Proof of Concept (PoC) release
- Credential Explorer page in Freelens cluster menu
- Comprehensive credential discovery and monitoring:
  - Age tracking for all Kubernetes Secrets
  - Expiry prediction for certificates and tokens
  - Origin classification (Vault, External Secrets, ArgoCD, cert-manager, Helm, Manual, Kubernetes)
  - Relationship mapping to Deployments, Pods, and ServiceAccounts
  
### 🔍 Filtering & Sorting
- Filter by namespace, origin, and severity
- Multiple sort options: severity, expiry date, age, namespace, Secret name
- Ascending/descending order control
- Text search across Secret names, deployments, and service accounts

### 🛡️ Security Insights
- Normalized severity levels: `none`, `info`, `warning`, `critical`
- Warning badges for problematic credentials
- Detailed evidence chain showing why credentials were flagged
- TLS/SSL certificate support with cert-manager detection

### 📊 UI Components
- Interactive table with sortable columns
- Detailed side panel with metadata, evidence, and relationships
- Real-time filtering without cluster dependency (mock data)
- Responsive design for various screen sizes

### 🔧 Architecture
- Freelens extension structure (main + renderer)
- TypeScript/React implementation
- Mock data adapter for development without cluster dependency
- Analyzers for TLS certificates, External Secrets, and workload references

### 📝 Documentation
- Comprehensive README with features and usage instructions
- Installation guides (Freelens Extensions menu + manual)
- Build from source instructions
- Project structure documentation
- Screenshot with feature overview

### 📦 Distribution
- Pre-built tarball: `freelens-credential-explorer-0.1.0.tgz`
- Available for direct download from repository
- Support for Freelens v1.9.0 and later

### ⚠️ Known Limitations
- Uses mock dataset (no live cluster data yet)
- Proof of Concept - feature set may change
- Does not persist configuration
- No warning policies implemented yet

---

## [Unreleased]

### 🚧 Planned Features
- Real Kubernetes watchers for live data
- Persistent configuration storage
- Policy-driven warning system
- Support for additional credential sources
- Enhanced visualization options
- Drill-down detail view with timeline
