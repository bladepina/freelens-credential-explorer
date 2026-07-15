# Freelens Credential Explorer Extension

Estensione Freelens (PoC) per visualizzare rapidamente lo stato delle credenziali Kubernetes con la relazione:

Secret -> Deployment -> Pods -> ServiceAccount

## Obiettivo

Fornire una dashboard operativa per rispondere in pochi secondi a queste domande:

- Quanto e vecchio un Secret?
- Quando scade?
- In quale namespace vive?
- Da dove proviene (Vault, External Secrets, manuale)?
- Ci sono warning critici?

## Stato attuale

Questo scaffold include:

- struttura extension Freelens (`main` + `renderer`)
- pagina `Credential Explorer` nel menu cluster
- tabella iniziale con colonne: Secret, age, scadenza, namespace, origine, relazione, warning
- filtri su namespace, origine e severity
- ordinamento su severity, scadenza, age, namespace e secret
- severity normalizzata (`none`, `info`, `warning`, `critical`) con badge
- dataset mock per sviluppare UI e logica senza dipendenza dal cluster

## Struttura progetto

- `src/main/index.ts`: entrypoint main extension
- `src/renderer/index.tsx`: registrazione pagina e menu
- `src/renderer/CredentialExplorerPage.tsx`: UI iniziale
- `src/renderer/credential-store.ts`: adapter mock + calcolo indicatori
- `src/common/types.ts`: modelli condivisi

## Build locale

Prerequisiti:

- Node.js 24+
- pnpm

Comandi:

```sh
pnpm install
pnpm build
pnpm pack
```

Il tarball generato puo essere caricato in Freelens da Extensions.

## Prossimi step consigliati

1. Sostituire i mock con watcher Kubernetes reali:
   - Secrets
   - Pods
   - Deployments / ReplicaSets
   - ServiceAccounts
2. Aggiungere rilevamento origine:
   - `external-secrets.io/*` annotations
   - label/annotation Vault injector
   - fallback `manual`
3. Implementare warning policy-driven:
   - expired
   - expiry entro X giorni
   - secret non referenziato
   - service account senza automount o token projection incoerente
4. Filtri e ordinamento:
   - per namespace
   - per origine
   - per severita warning
5. Drill-down dettaglio Secret con timeline rotazione.
