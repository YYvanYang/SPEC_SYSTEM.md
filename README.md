下面是“**Hugo / Cloudflare Workers 技术栈**”的**最终落地方案文档（零省略版）**。
你可以把整篇作为仓库根的 `SPEC_SYSTEM.md`，并**逐个文件**拷贝到对应路径后即可运行。所有脚本/工作流已按 Hugo（生成静态到 `public/`）+ Cloudflare Workers（通过 **Wrangler** 与 **wrangler‑action** 部署，使用 **Static Assets**）落地；并整合 **Spec‑Driven 三件套**、**Claude Code 的 Sub‑Agents + Hooks + Slash‑Commands**、**GitHub Actions 门禁与部署**。

> 说明：
>
> 1. 本文包含**完整文件内容**，无省略。
> 2. 涉及 Hugo 与 Cloudflare Workers 的关键做法，均附官方参考。（见每段后“参考”）
> 3. 需要你在 GitHub 仓库中配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 两个 Secret；部署工作流已内置 **cloudflare/wrangler‑action\@v3**。([GitHub][1])

---

# SPEC\_SYSTEM.md — Hugo × Cloudflare Workers × Spec‑Driven

**目标**：把“规范→设计→任务→实现→测试→审阅→部署”的闭环**落库**、**可追踪**、**可度量**，并通过 **Claude Code**（Sub‑agents、Hooks、Slash‑commands）与 **GitHub Actions**（Spec Lint / Trace / 权限 / Hugo 构建 / Workers 部署）将其**制度化**。

---

## 0) 仓库结构（创建如下目录与文件）

```text
.
├─ .claude/
│  ├─ agents/
│  │  ├─ spec-architect.md
│  │  ├─ requirements-editor.md
│  │  ├─ design-architect.md
│  │  ├─ task-planner.md
│  │  ├─ implementer.md
│  │  ├─ test-runner.md
│  │  ├─ code-reviewer.md
│  │  └─ doc-writer.md
│  ├─ commands/
│  │  ├─ spec-init.md
│  │  ├─ spec-lint.md
│  │  ├─ spec-trace.md
│  │  ├─ spec-review.md
│  │  ├─ hugo-build.md
│  │  └─ worker-dev.md
│  ├─ hooks/
│  │  ├─ protect-paths.py
│  │  └─ check-style.sh
│  └─ settings.json
├─ specs/
│  └─ checkout-auth-001/
│     └─ v1.0/
│        ├─ requirements.md
│        ├─ design.md
│        ├─ tasks.md
│        ├─ adr.md
│        └─ changelog.md
├─ worker/
│  └─ src/
│     └─ index.ts
├─ public/                      # Hugo 构建输出目录（hugo 会生成）
├─ wrangler.jsonc               # Workers 配置（assets 指向 ./public/）
├─ scripts/
│  ├─ spec-lint.js
│  ├─ trace-check.js
│  └─ permission-check.js
├─ .github/
│  └─ workflows/
│     ├─ spec-ci.yml
│     └─ deploy-worker.yml
├─ SPEC_POLICY.md
├─ CONTRIBUTING.md
└─ package.json
```

---

## 1) 项目政策与模板文件（完整内容）

### 1.1 `SPEC_POLICY.md`

```md
# SPEC_POLICY

## 1. Spec 命名与版本
- 目录：`specs/<domain>-<feature>-<id>/v<MAJOR>.<MINOR>/`
- 示例：`specs/checkout-auth-001/v1.0/`
- 每个目录至少包含：`requirements.md`、`design.md`、`tasks.md`、`adr.md`、`changelog.md`

## 2. Definition of Ready (DoR) — for specs
- [ ] **Scope 明确**（必须包含 Out-of-Scope）
- [ ] **需求使用 EARS 句式**：`WHEN <condition>, THE SYSTEM SHALL <behavior>.`
- [ ] **每条需求具备可测试的验收标准**（含 Negative/负例）
- [ ] **至少 1 张图**（架构/组件/时序，Mermaid 均可）
- [ ] **任务拆分到 0.5~2 天粒度**，每条包含 Done 判据、Trace（指向 R-*）

## 3. Definition of Done (DoD) — for implementation
- [ ] **所有 Trace 到 R-* 的测试通过**（含负例）
- [ ] **测试覆盖率 ≥ 80%**（或团队阈值）
- [ ] **变更写入** `changelog.md`（版本、日期、影响面、指标）
- [ ] **关键决策写入** `adr.md` 并在 PR 描述中链接
- [ ] **必要文档更新**（README/部署/迁移指南）

## 4. Trace 规则
- 需求以 `R-<n>` 标识（如 R-1、R-2）。
- 任务、测试、提交信息、或代码注释必须出现对应 `R-*`。
- 紧急豁免使用 `TRACE-EXCEPTION:` 前缀 + 原因。

## 5. 变更治理
- 重大技术选择记录于 `adr.md`（Context/Decision/Alternatives/Consequences/Links）。
- 发布在 `changelog.md` 记录指标（Spec→PR 首次通过率、平均回合数、Lead Time、缺陷/回滚率）。

## 6. 安全与权限
- 实施/测试类自动化只允许在受限目录执行（如 `src/`、`tests/`、`specs/**/tasks.md`）。
- 受保护文件（`.env`、`.github/workflows/`、`package-lock.json` 等）禁止自动修改。
```

---

### 1.2 `CONTRIBUTING.md`

```md
# CONTRIBUTING

## 1. 分支与 PR 流程
1) **Spec-only PR**：仅提交/更新 `specs/**` 与 `.claude/agents/**`，通过 `spec_lint` 后合并。
2) **Implement PR**：实现代码与测试，必须在 diff/提交/注释中引用 `R-*`，通过 `trace_check` 与 `tests`。

## 2. Commit/PR 规范
- Commit 标题示例：`feat(auth): show invalid-credential banner (Trace: R-1)`
- PR 描述示例：
  - 实现任务：T-1/T-2
  - 负例用例覆盖
  - 链接 ADR：`specs/checkout-auth-001/v1.0/adr.md#ADR-2025-07-27`
  - 影响面/回滚：见 `design.md`

## 3. 本地自检
- 运行 `/spec-lint` 与 `/spec-trace`（Slash-commands）进行本地验证。
- 提交前运行 `npm run spec:lint`、`npm run trace:check`。

## 4. Hugo / Workers 约定
- Hugo 构建命令：`hugo --gc --minify -e production`（输出到 `public/`）
- Cloudflare Workers 通过 `wrangler.jsonc` 配置 `assets.directory: "./public/"`，并由 GitHub Actions 使用 wrangler-action 部署。  
```

> **参考**：Hugo 官方 Actions 安装与构建（`peaceiris/actions-hugo`），支持安装指定版本/extended 版本；构建示例 `hugo --minify`。([GitHub][2])
> **参考**：Cloudflare Workers **Static Assets** 配置（`assets.directory` 指向 `./public/`），可选 `binding` / `run_worker_first` 等；Wrangler 推荐使用 `wrangler.jsonc`。([Cloudflare Docs][3], [Cloudflare Docs][4])

---

### 1.3 Spec 三件套与附属文件（示例，放到 `specs/checkout-auth-001/v1.0/`）

#### `requirements.md`

```md
# Requirements — Checkout Authentication

## Out-of-Scope
- OAuth/SAML 单点登录
- 第三方社交登录
- 账号注册与找回流程（另有 spec）

## R-1 Invalid credentials feedback
EN: WHEN a user submits invalid credentials, THE SYSTEM SHALL display a precise, non-intrusive error near the password field.
ZH: 当用户提交无效凭证时，系统应在密码字段附近以非侵入方式展示精确信息。
Acceptance:
- Appears within ≤200ms after server response
- Disappears after successful login or manual dismiss
- Logged with reason=INVALID_CREDENTIALS level=WARN
- Negative: 不暴露堆栈、用户信息、或敏感字段

## R-2 Rate limit feedback
EN: WHEN the API returns 429 for login attempts, THE SYSTEM SHALL inform user of temporary lockout and show retry-after seconds.
ZH: 当登录触发 429 限流时，系统应提示临时锁定并显示剩余等待秒数。
Acceptance:
- Shows remaining seconds accurately within ±1s
- i18n: zh/en 完整
- Observability: log field "RETRY_AFTER"
- Negative: 不暴露具体安全阈值或算法

## R-3 Unified error mapping
EN: WHEN any auth-like error occurs, THE SYSTEM SHALL map backend codes to UI-friendly unified codes.
ZH: 当出现认证相关错误时，系统应将后端错误码统一映射为前端友好错误。
Acceptance:
- 401/403 → INVALID_CREDENTIALS；429 → RATE_LIMITED
- 可扩展：未知码默认 OTHER_AUTH_ERROR
- 记录映射来源与上下文
- Negative: 不误将 5xx/网络错误映射为认证失败
```

#### `design.md`

```md
# Design

## Context & Components
- Hugo 负责生成静态站点至 `public/`
- Cloudflare Workers 以 `assets.directory=./public/` 提供静态资源
- 可选：通过 Worker 代码拦截动态路由或自定义缓存头

## Sequence (Mermaid)
sequenceDiagram
  participant U as User
  participant W as Worker
  participant A as ASSETS
  U->>W: GET /login
  alt file exists
    W->>A: env.ASSETS.fetch(request)
    A-->>W: 200 (HTML)
    W-->>U: 200 (HTML)
  else not found & /api/*
    W-->>U: 200 (API response)
  else not found
    W-->>U: 404
  end

## Constraints & Observability
- Static Assets 目录指向 `./public/`（Hugo 输出）
- 可启用 `run_worker_first` 以便先执行 Worker 逻辑再回落到 ASSETS（用于统一缓存策略或 API 前置检查）
- 日志包含必要字段（reason、userHash、maskedIp）

## Risks
- 错误码映射不一致 → 统一映射层并加强测试
- 过度开启 run_worker_first 影响纯静态资源延迟 → 仅对需要的路由开启

## Rollback
- 通过 `wrangler versions` 或回滚至上一次已知版本；静态资源回滚即回退构建产物

## Alternatives
- 不启用 Worker 代码，仅使用 assets-first 模式（延迟最低，灵活性较弱）
```

> **参考**：Static Assets 的 `directory`/`binding`/`run_worker_first` 与在 Worker 中 `env.ASSETS.fetch(request)` 获取资源；`wrangler.jsonc` 推荐。([Cloudflare Docs][3], [Cloudflare Docs][4])

#### `tasks.md`

```md
# Tasks — Checkout Authentication

- [ ] T-1 Banner UI wiring
  Trace: R-1
  Owner: @alice
  Timebox: 1d
  Steps:
    - 创建 <Banner> 组件，ARIA role=alert
    - 在密码字段附近渲染，支持“关闭”
  Done:
    - 单元：渲染/关闭
    - e2e：无效凭证时横幅展示且可关闭

- [ ] T-2 Server response mapping
  Trace: R-1, R-3
  Owner: @bob
  Timebox: 1d
  Steps:
    - 401/403 → INVALID_CREDENTIALS
    - 日志：level=WARN, reason=INVALID_CREDENTIALS
  Done:
    - 集成测试断言日志字段
    - 负例：429/5xx 不映射为 INVALID_CREDENTIALS

- [ ] T-3 Rate-limited UX
  Trace: R-2
  Owner: @alice
  Timebox: 1d
  Steps:
    - 显示 retry-after 秒数（精度 ±1s）
    - i18n：zh/en
  Done:
    - 单元：倒计时逻辑
    - e2e：429 场景展示正确
```

#### `adr.md`

```md
# ADR-2025-07-27 Use a dedicated error mapping layer
Context:
- 后端多处返回与认证相关的错误码，表现不一致，UI 难以统一处理。
Decision:
- 引入统一的 auth-error-mapper，在前端集中完成错误码 → UI 友好码的映射。
Alternatives:
- A1: UI 各处自行判断原始错误码（不可取，易重复）
- A2: 后端统一映射并直出文案（前端灵活性下降、i18n 成本上升）
Consequences:
- + 一致性 + 可测试 + 便于 observability；- 需要一层适配与维护
Links:
- R-1, R-2, R-3；Tasks: T-2, T-3；PR: #123
```

#### `changelog.md`

```md
## v1.0 — 2025-07-27
- 初版 spec（R-1 ~ R-3）完成
- 计划实施任务：T-1/T-2/T-3

### Metrics Baseline
- Spec→PR 首次通过率：N/A
- 平均往返回合数：N/A
- Lead Time（Spec→合并）：N/A
- 缺陷/回滚率：N/A
```

---

## 2) Claude Code 子代理（`.claude/agents/*.md`，完整 8 个）

> 说明：以下 8 个子代理均为**完整内容**，直接创建同名文件即可使用。可在 Claude Code 中用 `/agents` 管理项目级代理。

**2.1 `spec-architect.md`**

```md
---
name: spec-architect
description: Create/refine a 3-part spec (requirements EARS, design, tasks) from PRDs/issues/vibe chats. Use proactively for complex work.
---
You are a senior facilitator and spec architect.
Deliverables:
1) requirements.md with EARS + acceptance (incl. negative) and Out-of-Scope.
2) design.md with context/components/sequence (Mermaid)/constraints/observability/risks/rollback/alternatives.
3) tasks.md with Trace to R-*, Owner, Timebox, concrete Done criteria.
If any input is vague or contradictory, stop and ask clarifying questions BEFORE suggesting implementation.
```

**2.2 `requirements-editor.md`**

```md
---
name: requirements-editor
description: Normalize requirements into EARS; ensure testable acceptance (incl. negative); flag ambiguities.
---
Rewrite requirements to strict EARS:
WHEN <condition>, THE SYSTEM SHALL <behavior>.
Add acceptance criteria and negative cases. Keep stable IDs (R-1..n).
```

**2.3 `design-architect.md`**

```md
---
name: design-architect
description: Produce design.md with diagrams, constraints, observability, risks, rollback and trade-offs.
---
Prefer clear isolation of concerns, idempotent interfaces, and structured logging. Provide at least one Mermaid diagram (sequence/flowchart). Document alternatives with pros/cons.
```

**2.4 `task-planner.md`**

```md
---
name: task-planner
description: Break requirements into tasks with dependency, owner, timebox and Done criteria. Enforce Trace to R-*.
---
Ensure each task is 0.5~2d in size. Each includes Steps and Done checks that are testable. If missing requirements or unclear design, request updates to the spec first.
```

**2.5 `implementer.md`**

```md
---
name: implementer
description: Implement tasks precisely and minimally; keep diffs small; update task status. If spec conflicts arise, request spec updates first.
---
Follow tasks.md exactly. Do not invent requirements. If constraints conflict with codebase realities, open a spec change request and wait for sign-off.
```

**2.6 `test-runner.md`**

```md
---
name: test-runner
description: Generate and run tests; fix failures with minimal changes while preserving intent; report root cause and evidence; verify again.
---
Run tests early and often. Prefer minimal, targeted fixes. Provide evidence (failing assertion, logs) and verify success after changes.
```

**2.7 `code-reviewer.md`**

```md
---
name: code-reviewer
description: Perform code review against the spec; produce MUST/SHOULD/NICE lists with concise rationales; ensure traces to R-*, adequate tests, and rollback strategy alignment.
---
Block merges if MUST items aren't resolved. Confirm logging fields, i18n, and negative cases are covered.
```

**2.8 `doc-writer.md`**

```md
---
name: doc-writer
description: Update README/CHANGELOG/migration notes; ensure links to ADR and spec are correct; summarize impact and ops notes.
---
Keep docs succinct and actionable. Include version/date and metrics in changelog entries.
```

---

## 3) Hooks（`.claude/settings.json` 与脚本，完整内容）

> 赋权：
>
> ```bash
> chmod +x .claude/hooks/protect-paths.py
> chmod +x .claude/hooks/check-style.sh
> ```
>
> `settings.json` 为项目级 hooks 配置；Claude Code 在执行时注入 `$CLAUDE_PROJECT_DIR`。**PreToolUse** 阶段阻止对敏感路径的写入；**PostToolUse** 阶段自动格式化；**UserPromptSubmit** 给出“先写 spec 再实现”的提醒。

**3.1 `.claude/settings.json`**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/protect-paths.py",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '\"\\(.tool_input.command)\"' >> ~/.claude/bash-command-log.txt"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/check-style.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 - <<'PY'\nimport json,sys;from pathlib import Path\np=json.load(sys.stdin)\nok=any(Path('.').rglob('specs/*/v*/tasks.md'))\nprint('⚠ 建议先完善 spec 三件套并通过 lint（requirements/design/tasks）') if not ok else None\nPY"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[Claude Code] Notification at $(date)\" >> .claude/notification.log"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"Subagent finished: $(date)\" >> .claude/subagent.log"
          }
        ]
      }
    ]
  }
}
```

**3.2 `.claude/hooks/protect-paths.py`**

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阻止对子项目敏感文件的自动写入/编辑。
非 0 退出码将阻止本次工具调用（Claude Code 会给出反馈）。
"""
import json, sys

payload = sys.stdin.read()
try:
    data = json.loads(payload or "{}")
except Exception:
    print("protect-paths: invalid JSON payload")
    sys.exit(2)

ti = data.get("tool_input") or {}
file_path = ti.get("file_path") or ti.get("path") or ""
files = ti.get("files") or []
if isinstance(files, str):
    files = [files]

candidates = set()
if file_path:
    candidates.add(file_path)
for f in files:
    if isinstance(f, dict):
        p = f.get("path") or f.get("file_path") or ""
        if p:
            candidates.add(p)
    elif isinstance(f, str):
        candidates.add(f)

forbidden_subpaths = [
    ".env",
    ".git/",
    ".github/workflows/",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
]

hit = []
for p in candidates:
    for forb in forbidden_subpaths:
        if forb in p:
            hit.append(p)
            break

if hit:
    print("❌ Protected paths (edit/write blocked):")
    for p in hit:
        print(" -", p)
    sys.exit(2)

sys.exit(0)
```

**3.3 `.claude/hooks/check-style.sh`**

```bash
#!/usr/bin/env bash
# 在 Write/Edit 后自动格式化常见文件类型（需要本地 node / prettier）
set -euo pipefail

payload="$(cat || true)"
file=$(echo "$payload" | jq -r '.tool_input.file_path // .tool_input.path // ""')

if [ -z "$file" ]; then
  files=$(echo "$payload" | jq -r '.tool_input.files[]?.path // empty')
else
  files="$file"
fi

[ -z "${files:-}" ] && exit 0

for f in $files; do
  if [[ "$f" =~ \.(js|mjs|cjs|ts|tsx|jsx|json|css|md|html)$ ]]; then
    if command -v npx >/dev/null 2>&1; then
      npx --yes prettier --write "$f" || true
    fi
  fi
done

exit 0
```

---

## 4) Slash‑commands（`.claude/commands/*.md`，完整内容）

### 4.1 `spec-init.md`

```md
---
description: Initialize a spec scaffold under specs/<domain>-<feature>-<id>/v1.0
allowed-tools: Bash(mkdir:*), Bash(bash:*), Bash(touch:*), Bash(sh:*)
argument-hint: "<domain>-<feature>-<id>"
---

## Context
Creating scaffold for: $ARGUMENTS

## Actions
!`bash -lc '
set -e
base="specs/$ARGUMENTS/v1.0"
mkdir -p "$base"
cat > "$base/requirements.md" <<EOF
# Requirements — <Feature>

## Out-of-Scope
- TBD

## R-1 Example requirement
EN: WHEN <condition>, THE SYSTEM SHALL <behavior>.
ZH: 当 <条件> 时，系统应 <行为>。

Acceptance:
- <measurable criteria>
- Negative: <negative case>
EOF

cat > "$base/design.md" <<EOF
# Design

## Context & Components
- TBD

## Sequence (Mermaid)
sequenceDiagram
  participant A as Actor
  participant S as System
  A->>S: Trigger
  S-->>A: Response

## Constraints & Observability
- TBD

## Risks
- TBD

## Rollback
- TBD

## Alternatives
- TBD
EOF

cat > "$base/tasks.md" <<EOF
# Tasks — <Feature>

- [ ] T-1 Example task
  Trace: R-1
  Owner: @owner
  Timebox: 1d
  Steps:
    - Step 1
  Done:
    - Unit test
EOF

cat > "$base/adr.md" <<EOF
# ADR-$(date +%F) Example ADR
Context:
- TBD

Decision:
- TBD

Alternatives:
- TBD

Consequences:
- TBD

Links:
- R-1
EOF

cat > "$base/changelog.md" <<EOF
## v1.0 — $(date +%F)
- Initial spec created

### Metrics Baseline
- Spec→PR First Pass: N/A
- Avg Rounds: N/A
- Lead Time: N/A
- Defects/Rollback: N/A
EOF
'`
```

### 4.2 `spec-lint.md`

```md
---
description: Run local spec lint (same as CI)
allowed-tools: Bash(npm ci:*), Bash(npm run spec:lint:*), Bash(node:*)
---

Run local spec lint and summarize failures.

!`npm ci`
!`npm run spec:lint`
```

### 4.3 `spec-trace.md`

```md
---
description: Run local trace check against current diff
allowed-tools: Bash(npm run trace:check:*), Bash(git diff:*), Bash(node:*)
---

Check if changes reference R-* in code/tests/commits.

!`npm run trace:check || true`
```

### 4.4 `spec-review.md`

```md
---
description: Review current spec changes and produce MUST/SHOULD/NICE suggestions
---

Read updated files under @specs and output a structured review:
- MUST (blocking)
- SHOULD (recommended)
- NICE TO HAVE (optional)
```

### 4.5 `hugo-build.md`

```md
---
description: Build Hugo site (production)
allowed-tools: Bash(hugo:*), Bash(npm ci:*), Bash(npx:*), Bash(node:*), Bash(ls:*), Bash(find:*), Bash(rm:*), Bash(mkdir:*), Bash(cp:*), Bash(sh:*), Bash(bash:*)
---

Build the static site with Hugo (outputs to ./public), then summarize artifacts.

!`hugo version || true`
!`hugo --gc --minify -e production`
!`ls -lah public | head -n 50`
```

### 4.6 `worker-dev.md`

```md
---
description: Run Wrangler dev server for the Worker
allowed-tools: Bash(npx:*), Bash(node:*), Bash(npm ci:*), Bash(wrangler:*), Bash(sh:*), Bash(bash:*)
---

Start a local dev server for the Worker using Wrangler.

!`npx wrangler dev --local`
```

> **参考**：Wrangler CLI 本地开发 `wrangler dev`；Hugo 构建示例。([Cloudflare Docs][5], [GitHub][2])

---

## 5) Hugo × Workers 配置与最小 Worker 代码

### 5.1 `wrangler.jsonc`（完整配置）

> 使用 **assets-first** 提供 `./public/` 静态资源；为可选动态逻辑开启 `run_worker_first` 并绑定 `ASSETS`，Worker 代码可在找不到静态资源时接管或统一缓存策略。

```jsonc
{
  "name": "hugo-assets-worker",
  "main": "worker/src/index.ts",
  "compatibility_date": "2025-07-25",
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"] // 仅对 /api/* 先运行 Worker，其余走 assets-first
  },
  "workers_dev": true
}
```

> **参考**：`assets.directory` 指定静态目录；`binding` 允许在 Worker 代码中 `env.ASSETS.fetch()` 获取资源；`run_worker_first` 可按路由数组选择先执行代码或先走静态。官方推荐新项目使用 **wrangler.jsonc**。([Cloudflare Docs][3], [Cloudflare Docs][4])

### 5.2 `worker/src/index.ts`（最小可用 + 简单缓存策略）

```ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 示例：简单 API（命中 run_worker_first）
    if (url.pathname.startsWith("/api/health")) {
      return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // 否则尝试回落到静态资源（ASSETS）
    // 这里可统一处理 Cache-Control：对带 hash 的文件设置长缓存
    const res = await env.ASSETS.fetch(request);
    const hdr = new Headers(res.headers);
    const path = url.pathname;

    // 简单约定：文件名包含 .[hash]. 的静态资源长缓存
    if (/\.[a-f0-9]{8,}\./i.test(path)) {
      hdr.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (path.endsWith(".html")) {
      hdr.set("Cache-Control", "public, max-age=60"); // HTML 短缓存
    }

    return new Response(res.body, { status: res.status, headers: hdr });
  },
};

interface Env {
  ASSETS: Fetcher;
}
```

> **参考**：Worker 代码中使用 `env.ASSETS.fetch(request)` 回退到静态资源绑定。([Cloudflare Docs][3])

---

## 6) GitHub Actions 与校验脚本（完整内容）

> 我们给出两套工作流：
>
> 1. **spec-ci.yml**：门禁（Spec Lint / Trace / 权限 / Hugo 构建）
> 2. **deploy-worker.yml**：主分支 push 时构建 Hugo 并用 **wrangler‑action** 部署到 Workers
>
> 需要在仓库 Secrets 配置：
>
> * `CLOUDFLARE_API_TOKEN`（Workers 部署 Token）
> * `CLOUDFLARE_ACCOUNT_ID`（账户 ID）
>
> **cloudflare/wrangler-action\@v3** 的使用、必需 inputs（如 `apiToken`、可选 `accountId`/`command`）见官方。([GitHub][1], [Cloudflare Docs][6])
> **Hugo 安装**使用 `peaceiris/actions-hugo@v3`。([GitHub][2])

### 6.1 `package.json`

```json
{
  "name": "spec-pipeline",
  "private": true,
  "type": "module",
  "scripts": {
    "spec:lint": "node scripts/spec-lint.js",
    "trace:check": "node scripts/trace-check.js",
    "perm:check": "node scripts/permission-check.js",
    "test": "hugo --gc --minify -e production"
  },
  "devDependencies": {
    "globby": "^14.0.2",
    "markdown-it": "^14.1.0"
  }
}
```

### 6.2 `scripts/spec-lint.js`

```js
#!/usr/bin/env node
/**
 * 校验内容：
 * - requirements.md：R-*（EARS + Acceptance + Negative + Out-of-Scope）
 * - design.md：Mermaid 图、Risks、Rollback
 * - tasks.md：存在任务、每条含 Trace: R-* 与 Done:
 */
import { globby } from 'globby';
import fs from 'node:fs/promises';

let failed = false;
const fail = (msg) => { console.error(msg); failed = true; };

const files = await globby(['specs/**/v*/{requirements,design,tasks}.md'], { dot: true });
if (files.length === 0) fail('❌ No spec files found under specs/**/v*/');

for (const file of files) {
  const text = await fs.readFile(file, 'utf8');

  if (file.endsWith('requirements.md')) {
    if (!/Out-of-Scope/i.test(text)) fail(`❌ ${file}: missing "Out-of-Scope" section`);
    const blocks = text.match(/##\s*R-\d+[\s\S]*?(?=##\s*R-\d+|$)/g) || [];
    if (blocks.length === 0) fail(`❌ ${file}: no "R-*" sections found`);
    for (const b of blocks) {
      if (!/WHEN[\s\S]+THE SYSTEM SHALL/i.test(b)) fail(`❌ ${file}: EARS sentence missing:\n${b.slice(0,120)}...`);
      if (!/Acceptance:/i.test(b)) fail(`❌ ${file}: Acceptance criteria missing`);
      if (!/Negative:/i.test(b)) fail(`❌ ${file}: Negative case missing`);
    }
  }

  if (file.endsWith('design.md')) {
    if (!/sequenceDiagram|flowchart|classDiagram|stateDiagram/i.test(text)) fail(`❌ ${file}: no Mermaid diagram found`);
    if (!/Risks/i.test(text)) fail(`❌ ${file}: "Risks" section missing`);
    if (!/Rollback/i.test(text)) fail(`❌ ${file}: "Rollback" section missing`);
  }

  if (file.endsWith('tasks.md')) {
    const tasks = text.match(/- \[.\] .+?(\n\s{2,}.+)+/g) || [];
    if (tasks.length === 0) fail(`❌ ${file}: no tasks found`);
    for (const t of tasks) {
      if (!/Trace:\s*R-\d+/i.test(t)) fail(`❌ ${file}: task without "Trace: R-*" →\n${t.split('\n')[0]}`);
      if (!/Done:/i.test(t)) fail(`❌ ${file}: task without "Done:" →\n${t.split('\n')[0]}`);
    }
  }
}

if (failed) { console.error('\nSpec Lint failed.'); process.exit(1); }
console.log('✅ Spec Lint passed.');
```

### 6.3 `scripts/trace-check.js`

```js
#!/usr/bin/env node
/**
 * 校验 PR 变更是否引用 R-*；允许 "TRACE-EXCEPTION:" 豁免。
 */
import { execSync } from 'node:child_process';
const sh = (c) => execSync(c, { stdio: ['ignore','pipe','pipe'] }).toString();

const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
const head = process.env.GITHUB_SHA || 'HEAD';

const changed = sh(`git diff --name-only ${base} ${head}`)
  .trim().split('\n')
  .filter(f => f && !f.startsWith('specs/') && !f.startsWith('.claude/') && !f.startsWith('.github/'));

if (changed.length === 0) { console.log('No relevant files changed. Skipping trace check.'); process.exit(0); }

const diff = sh(`git diff -U0 ${base} ${head}`);
const commits = sh(`git log --format=%B ${base}..${head}`);

const ok = /R-\d+/.test(diff) || /R-\d+/.test(commits) || /TRACE-EXCEPTION:/i.test(diff) || /TRACE-EXCEPTION:/i.test(commits);
if (!ok) {
  console.error('❌ Trace Check failed: No "R-*" found in diff/commits.\nAdd "Trace: R-1" in code/tests/commit or "TRACE-EXCEPTION: reason".');
  process.exit(1);
}
console.log('✅ Trace Check passed.');
```

### 6.4 `scripts/permission-check.js`

```js
#!/usr/bin/env node
/**
 * 根据 PR label 限制敏感路径改动（示例：bot-implementer）
 */
import { execSync } from 'node:child_process';
const sh = (c) => execSync(c, { stdio: ['ignore','pipe','pipe'] }).toString();

const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
const head = process.env.GITHUB_SHA || 'HEAD';
const labels = (process.env.PR_LABELS || '').split(',').map(s => s.trim()).filter(Boolean);
const isBot = labels.includes('bot-implementer');

const diff = sh(`git diff --name-status ${base} ${head}`).trim().split('\n').filter(Boolean)
  .map(line => { const [status, ...rest] = line.split(/\s+/); return { status, file: rest.join(' ') }; });

const forbidden = [];
for (const { file } of diff) {
  if (isBot) {
    if (/^\.github\/workflows\/|^SPEC_POLICY\.md$|^CONTRIBUTING\.md$/.test(file)) forbidden.push(file);
  }
}

if (forbidden.length) { console.error('❌ Permission Check failed. Bot cannot modify:\n' + forbidden.join('\n')); process.exit(1); }
console.log('✅ Permission Check passed.');
```

### 6.5 `.github/workflows/spec-ci.yml`

```yaml
name: Spec CI

on:
  pull_request:
    types: [opened, synchronize, reopened, labeled]
    branches: [ main, master ]
  push:
    branches: [ main, master ]
    paths:
      - 'specs/**'
      - '.claude/**'
      - 'scripts/**'
      - '.github/workflows/spec-ci.yml'
      - 'package.json'
      - 'SPEC_POLICY.md'
      - 'CONTRIBUTING.md'
      - 'worker/**'
      - 'wrangler.jsonc'

jobs:
  spec_lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run spec:lint

  trace_check:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Propagate PR labels
        run: echo "PR_LABELS=${{ join(github.event.pull_request.labels.*.name, ',') }}" >> $GITHUB_ENV
      - run: npm run trace:check

  permission_check:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Propagate PR labels
        run: echo "PR_LABELS=${{ join(github.event.pull_request.labels.*.name, ',') }}" >> $GITHUB_ENV
      - run: npm run perm:check

  hugo_build:
    runs-on: ubuntu-latest
    needs: [spec_lint, trace_check, permission_check]
    env:
      HUGO_CACHEDIR: /tmp/hugo_cache
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          submodules: true
      - uses: actions/cache@v4
        with:
          path: ${{ env.HUGO_CACHEDIR }}
          key: ${{ runner.os }}-hugomod-${{ hashFiles('**/go.sum') }}
          restore-keys: |
            ${{ runner.os }}-hugomod-
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'
          extended: true
      - name: Build Hugo
        run: hugo --gc --minify -e production
```

> **参考**：`peaceiris/actions-hugo@v3` 安装与构建示例，支持缓存 Hugo Modules。([GitHub][2])

### 6.6 `.github/workflows/deploy-worker.yml`

```yaml
name: Deploy Worker

on:
  push:
    branches: [ main ]
  workflow_dispatch: {}

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_CACHEDIR: /tmp/hugo_cache
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          submodules: true
      - uses: actions/cache@v4
        with:
          path: ${{ env.HUGO_CACHEDIR }}
          key: ${{ runner.os }}-hugomod-${{ hashFiles('**/go.sum') }}
          restore-keys: |
            ${{ runner.os }}-hugomod-
      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: 'latest'
          extended: true
      - name: Build Hugo
        run: hugo --gc --minify -e production

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy with Wrangler
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          # 默认执行 `wrangler deploy`，若你需要指定 env，可添加：
          # command: deploy --env production
```

> **参考**：Cloudflare 官方 **wrangler‑action** 用法、所需 Secrets、可传 `accountId`、`command`，以及“GitHub Actions 部署 Workers”指南。([GitHub][1], [Cloudflare Docs][6], [Cloudflare Docs][7])

---

## 7) 日常工作流（端到端）

### 7.1 规范先行（Spec‑only PR）

1. `/spec-init checkout-auth-001` 生成骨架；
2. `@spec-architect` 产出三件套；`@requirements-editor` 统一 EARS；`@design-architect` 补图/风险/回滚；`@task-planner` 拆任务（Trace/Owner/Timebox/Done）；
3. `/spec-lint` 本地自检 → 提交 **Spec‑only PR** → CI `spec_lint` 通过后合并。

### 7.2 实施与验证（Implement PR）

1. `@implementer` 逐条执行 `tasks.md`；每步后 `@test-runner` 跑测并**最小修复**；
2. `/spec-trace` 本地自检（确保 diff/提交含 `R-*` 或 `TRACE-EXCEPTION:`）；
3. 提交 PR，CI 经过 `trace_check` / `permission_check` / `hugo_build`。

### 7.3 部署（主分支）

* push 到 `main` → 触发 `deploy-worker.yml`：先构建 Hugo → `wrangler-action` 部署到 Workers（assets-first，`public/` 作为静态目录；如需路由到自定义域，按 `wrangler.jsonc` 配置 routes/zone）。([Cloudflare Docs][4])

---

## 8) 启用步骤（30 分钟）

1. **拷贝**本文所有文件到对应路径；
2. 赋予脚本可执行权限：

   ```bash
   chmod +x .claude/hooks/protect-paths.py
   chmod +x .claude/hooks/check-style.sh
   ```
3. **安装依赖**：`npm i`（或改用 pnpm/yarn，并同步工作流）；
4. **GitHub Secrets**：在仓库 `Settings → Secrets → Actions` 添加：

   * `CLOUDFLARE_API_TOKEN`（Workers 部署 Token）
   * `CLOUDFLARE_ACCOUNT_ID`（Cloudflare 账户 ID）
5. **分支保护**：将 `spec_lint`、`trace_check`、`permission_check`、`hugo_build` 设为 Required；
6. 在 Claude Code 运行 `/help` 与 `/hooks`，确认命令和 Hooks 已加载；
7. `/spec-init` → `/spec-lint` → 提 **Spec‑only PR**；再提 **Implement PR**；合并后主分支将自动部署到 Workers。

---

## 9) 追加说明与参考

* **Wrangler 配置建议**：新项目优先 `wrangler.jsonc`；可配置 routes/zone、environments 等；Treat wrangler 配置为**单一事实来源**（source of truth）。([Cloudflare Docs][4])
* **Static Assets 行为**：只能绑定一个 assets 目录；`run_worker_first` 可设为布尔或路由数组；`binding` 使 `env.ASSETS.fetch()` 可用；可用 `.assetsignore` 排除不应上传的文件。([Cloudflare Docs][3])
* **Hugo 安装/构建**：`peaceiris/actions-hugo@v3` 支持 `extended: true`、`hugo-version: latest`，并提供 Modules 缓存示例。([GitHub][2])
* **Wrangler Action**：`cloudflare/wrangler-action@v3`，`with.apiToken` 必填，`accountId` 常用，`command` 可覆盖默认；支持 `preCommands/postCommands`、`environment/secrets`。([GitHub][1])

---

### 完成！

至此，你已经拥有一套**从 Spec 到部署**的完整流水线：

* **规格**由子代理生成、lint 校验、Trace 约束；
* **实现**受 Hooks/权限护栏保护；
* **构建**使用 Hugo 动作快速产出 `public/`；
* **部署**用 `wrangler‑action` 发布到 Cloudflare Workers（静态资源由 `assets` 提供，必要时 Worker 代码接管 `/api/*` 与缓存策略）。

需要把 `wrangler.jsonc` 的路由绑定到你的自定义域名或多环境（staging/production），我也可以继续补齐示例（`routes`/`env.production` 配置、DNS/Zone 要求等）。

[1]: https://github.com/cloudflare/wrangler-action "GitHub - cloudflare/wrangler-action: ‍♀️ easily deploy cloudflare workers applications using wrangler and github actions"
[2]: https://github.com/peaceiris/actions-hugo "GitHub - peaceiris/actions-hugo: GitHub Actions for Hugo ⚡️ Setup Hugo quickly and build your site fast. Hugo extended, Hugo Modules, Linux (Ubuntu), macOS, and Windows are supported."
[3]: https://developers.cloudflare.com/workers/static-assets/binding/ "Configuration and Bindings · Cloudflare Workers docs"
[4]: https://developers.cloudflare.com/workers/wrangler/configuration/ "Configuration - Wrangler · Cloudflare Workers docs"
[5]: https://developers.cloudflare.com/workers/get-started/guide/?utm_source=chatgpt.com "Get started - CLI · Cloudflare Workers docs"
[6]: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/?utm_source=chatgpt.com "GitHub Actions - Workers - Cloudflare Docs"
[7]: https://developers.cloudflare.com/workers/ci-cd/external-cicd/?utm_source=chatgpt.com "External CI/CD - Workers - Cloudflare Docs"
