# kucoin-api (`@gainium/kucoin-api`)

## 📚 Platform knowledge base

A curated, auto-updated AI-agent knowledge base for the **whole Gainium platform** lives in the
private repo **`gainium-0-knowledge`** (`github.com/aressanch/gainium-0-knowledge`).
Local checkouts — Mac: `~/Git/Gainium Local/0-knowledge` · VPS: `/root/git/0-knowledge`.

Consult it before non-trivial work: `ARCHITECTURE.md` (service graph + danger boundaries),
`subsystems/<area>.md` (how each area works & breaks), `bug-patterns/`, `runbooks/`,
`domain/glossary.md`. Query 3.7k historical bugs by symptom:
`python3 <kb>/_raw/scripts/bugs.py find "<terms>"`. It is auto-enriched daily from agent session digests.

**Library, not a service.** TypeScript client for the KuCoin REST + WebSocket API, published as a github npm
dep. Map: [`../0-knowledge/ARCHITECTURE.md`](../0-knowledge/ARCHITECTURE.md).

## Run / test
- build `npm run build` · test `npm test` · lint `npm run lint`

## Coupling
- Imported by **exchange-connector** (its `core` / `exchange-connector-sh`) for KuCoin support
  (`exchanges/kucoin/*`). Bumping this lib affects the connector's KuCoin behavior.

## Rules
- Pure client library; no ports. Keep KuCoin-specific quirks here, not in the connector.
