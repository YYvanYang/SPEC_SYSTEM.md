---
description: Build Hugo site (production)
allowed-tools: Bash(hugo:*), Bash(npm ci:*), Bash(npx:*), Bash(node:*), Bash(ls:*), Bash(find:*), Bash(rm:*), Bash(mkdir:*), Bash(cp:*), Bash(sh:*), Bash(bash:*)
---

Build the static site with Hugo (outputs to ./public), then summarize artifacts.

!`hugo version || true`
!`hugo --gc --minify -e production`
!`ls -lah public | head -n 50`