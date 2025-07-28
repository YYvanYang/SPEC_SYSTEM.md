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