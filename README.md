# Freelens Credential Explorer Extension

A Freelens extension (PoC) to quickly visualize the status of Kubernetes credentials with the relationship:

Secret → Deployment → Pods → ServiceAccount

## Overview

Provide an operational dashboard to answer these questions in seconds:

- How old is a Secret?
- When does it expire?
- In which namespace does it live?
- Where does it come from (Vault, External Secrets, manual)?
- Are there critical warnings?

## Current Status

This scaffold includes:

- Freelens extension structure (`main` + `renderer`)
- `Credential Explorer` page in the cluster menu
- Initial table with columns: Secret, age, expiry, namespace, origin, relationship, warning
- Filters by namespace, origin, and severity
- Sorting by severity, expiry, age, namespace, and secret
- Normalized severity (`none`, `info`, `warning`, `critical`) with badges
- Mock dataset for developing UI and logic without cluster dependency

## Project Structure

- `src/main/index.ts`: main extension entrypoint
- `src/renderer/index.tsx`: page registration and menu
- `src/renderer/CredentialExplorerPage.tsx`: initial UI
- `src/renderer/credential-store.ts`: mock adapter + indicator calculations
- `src/common/types.ts`: shared models

## Local Build

Prerequisites:

- Node.js 24+
- pnpm

Commands:

```sh
pnpm install
pnpm build
pnpm pack
```

The generated tarball can be loaded in Freelens from Extensions.

## Recommended Next Steps

1. Replace mocks with real Kubernetes watchers:
   - Secrets
   - Pods
   - Deployments / ReplicaSets
   - ServiceAccounts
2. Add origin detection:
   - `external-secrets.io/*` annotations
   - Vault injector label/annotation
   - fallback `manual`
3. Implement policy-driven warnings:
   - expired
   - expiry within X days
   - unreferenced secret
   - service account without automount or inconsistent token projection
4. Filters and sorting:
   - by namespace
   - by origin
   - by warning severity
5. Drill-down detail view for Secret with rotation timeline.
