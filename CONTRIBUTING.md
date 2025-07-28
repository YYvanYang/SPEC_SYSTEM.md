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