# ETH-XRP Scanner

Paper-trading scanner for ETH and XRP futures on MEXC and Hyperliquid, with zone-detection, dollar stops, trailing profit, and cascade guard.

## Run & Operate

- ETH-XRP scanner: `pnpm --filter @workspace/eth-xrp-scanner run dev` (port 3000)
- Railway deployment pulls from `krishnanrvijay-afk/ETH-XRP-SCANNER` on GitHub

## Stack

- pnpm workspaces, Node.js 24
- Scanner: vanilla HTML/JS served by Express
- Proxies: MEXC Futures API + Hyperliquid API

## Where things live

- `artifacts/eth-xrp-scanner/public/eth_xrp_scanner.html` — main HL+MEXC scanner
- `artifacts/eth-xrp-scanner/server.js` — Express proxy server
- `artifacts/krishnan-snx-project/public/multi_pair_scanner.html` — MEXC multi-pair scanner

## User preferences

- **GitHub is master**: `krishnanrvijay-afk/ETH-XRP-SCANNER` is the source of truth. Before any coding session, pull the latest from GitHub (`git fetch github && git merge github/main`). After changes, always push back to GitHub so Railway picks them up.
- MEXC scanner changes are deferred and reviewed separately from HL changes.

## Gotchas

- GitHub remote is named `github` (not `origin`) — `git push github main`
- Force push is required when Replit and GitHub histories diverge: `git push github main --force`
- Replit auto-commits go to internal `gitsafe-backup` only — manually push to `github` remote after every session
- Proxy URLs must be **relative** (`proxy/...` not `/proxy/...`) for Replit's path-based routing to work

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
