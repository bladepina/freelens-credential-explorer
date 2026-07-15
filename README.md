# Freelens Credential Explorer Extension

A Freelens extension (PoC) to quickly visualize the status of Kubernetes credentials with the relationship:

Secret → Deployment → Pods → ServiceAccount

## Compatibility

**Requirement versions:**
- **Freelens**: v1.9.0 and later
- **Node.js**: 24+
- **Kubernetes**: Any version with Secret API support

**Supported credential sources:**
- Vault
- External Secrets
- ArgoCD
- cert-manager / TLS certificates
- Helm releases
- Manual/Opaque secrets

## Overview

Provide an operational dashboard to answer these questions in seconds:

- How old is a Secret?
- When does it expire?
- In which namespace does it live?
- Where does it come from (Vault, External Secrets, manual)?
- Are there critical warnings?

## Features

### Credential Discovery & Monitoring

Automatically discovers and catalogs all Kubernetes Secrets with detailed metadata:
- **Age tracking**: Timestamp when credentials were created
- **Expiry prediction**: Countdown to certificate/token expiration dates
- **Origin classification**: Identifies where each credential comes from (Vault, External Secrets, cert-manager, etc.)
- **Relationship mapping**: Links Secrets to Deployments, Pods, and ServiceAccounts that use them
- **Warning system**: Flags outdated, orphaned, or misconfigured credentials with severity levels (`none`, `info`, `warning`, `critical`)

### Filtering & Search

- **By namespace**: Focus on specific Kubernetes namespaces
- **By origin**: Filter credentials by their management system
- **By severity**: Highlight critical or concerning credentials
- **Text search**: Quick lookup by Secret name, deployment, or service account

### Sorting & Prioritization

- Sort by severity, expiry date, age, namespace, or Secret name
- Ascending/descending order options
- Helps identify the most urgent credential issues first

### TLS/SSL Certificate Support

Automatic detection and monitoring of cert-manager managed certificates:
- **cert-manager integration**: Tracks Certificates managed by cert-manager
- **Certificate expiry tracking**: Identifies TLS Secrets approaching expiration
- **Kubernetes native TLS Secrets**: Support for `kubernetes.io/tls` type Secrets
- **Evidence chain**: Shows certificate details, management history, and related resources

### Detailed Secret Analysis

When you select a Secret, the side panel displays:
- **Summary**: Age, expiry, namespace, origin, usage classification
- **Evidence**: Why the Secret was classified this way (orphaned, unused, managed by X)
- **Relationships**: Pods, Deployments, ServiceAccounts referencing the Secret
- **Metadata**: Labels, annotations, owner references
- **Credential chain**: Where the Secret is mounted/used across your workloads

## Current Status

This scaffold includes:

- Freelens extension structure (`main` + `renderer`)
- `Credential Explorer` page in the cluster menu
- Initial table with columns: Secret, age, expiry, namespace, origin, relationship, warning
- Filters by namespace, origin, and severity
- Sorting by severity, expiry, age, namespace, and secret
- Normalized severity (`none`, `info`, `warning`, `critical`) with badges
- Mock dataset for developing UI and logic without cluster dependency

## Screenshot

![Credential Explorer UI](docs/credential-explorer.png)

## Project Structure

- `src/main/index.ts`: main extension entrypoint
- `src/renderer/index.tsx`: page registration and menu
- `src/renderer/CredentialExplorerPage.tsx`: initial UI
- `src/renderer/credential-store.ts`: mock adapter + indicator calculations
- `src/common/types.ts`: shared models

## Installation

### From Freelens Extensions Menu

Open Freelens and navigate to **Extensions** (`Ctrl+Shift+E` on Windows/Linux, `Cmd+Shift+E` on macOS):

```
Search for: freelens-credential-explorer
```

Or use the deeplink:

```
freelens://app/extensions/install/freelens-credential-explorer
```

### Manual Installation

Download the pre-built tarball:

```sh
# Download with wget
wget https://github.com/bladepina/freelens-credential-explorer/raw/main/freelens-credential-explorer-0.1.0.tgz

# Or with curl
curl -L -O https://github.com/bladepina/freelens-credential-explorer/raw/main/freelens-credential-explorer-0.1.0.tgz
```

In Freelens:
1. Go to **Extensions** (`Ctrl+Shift+E` or `Cmd+Shift+E`)
2. Drag and drop the tarball into the Extensions panel
3. Or click the file picker and select the tarball

The extension will load automatically and appear in your cluster menu.

## Build from Source

### Prerequisites

- **Node.js 24+**: Use [nvm](https://github.com/nvm-sh/nvm), [mise](https://mise.jdx.dev/), or your preferred Node version manager
- **pnpm**: Install via `corepack` or [pnpm.io](https://pnpm.io/installation)

```sh
# Install Node 24 (if using nvm)
nvm install 24
nvm use 24

# Install pnpm
corepack install
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Building the Extension

```sh
# Clone and navigate to the repository
git clone https://github.com/bladepina/freelens-credential-explorer
cd freelens-credential-explorer

# Install dependencies
pnpm install

# Build the extension
pnpm build

# Package for distribution
pnpm pack
```

The tarball will be generated in the current directory as `freelens-credential-explorer-0.1.0.tgz`.

### Development Build

```sh
# Type checking
pnpm type:check

# Production build with module preservation
pnpm build:production

# Clean build artifacts
pnpm clean
```

### Loading During Development

1. Run `pnpm build` to create the extension bundle
2. In Freelens, go to Extensions and load the `out/` directory or drag the tarball
3. Changes require a rebuild and extension reload

## Contributing

Contributions are welcome! Areas for improvement:

- Replace mock data with real Kubernetes watchers
- Add persistent configuration storage
- Implement warning policies
- Support for additional credential sources
- Enhanced visualization options

## License

MIT License - See [LICENSE](LICENSE) file for details.

Copyright © 2026 Freelens Credential Explorer Contributors
