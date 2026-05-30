---
name: GitHub master workflow
description: GitHub repo is the source of truth; Replit is a dev sandbox that syncs to it.
---

# GitHub is master

**Rule:** `krishnanrvijay-afk/ETH-XRP-SCANNER` on GitHub is the source of truth for this project. Railway auto-deploys from it.

**Why:** Replit's auto-commits go to an internal `gitsafe-backup` remote only. GitHub is the only remote Railway watches. Changes made in Replit that are not pushed to GitHub will never appear in production.

**How to apply — start of every session:**
1. `git fetch github` (remote named `github`, not `origin`)
2. Check divergence: `git log --oneline --left-right main...github/main`
3. If GitHub is ahead, merge: `git merge github/main` (or `--allow-unrelated-histories` if needed)
4. Then proceed with edits

**How to apply — end of every session:**
1. `git push github main`
2. If rejected (diverged): `git push github main --force`
3. Railway will redeploy automatically within ~1 minute

**Remote setup (if not present):**
Use the GitHub integration (`listConnections('github')`) to get the access token, then:
`git remote add github https://x-access-token:<token>@github.com/krishnanrvijay-afk/ETH-XRP-SCANNER.git`
