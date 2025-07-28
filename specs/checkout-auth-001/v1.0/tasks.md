# Tasks — Checkout Authentication

- [ ] T-1 Banner UI wiring
  Trace: R-1
  Owner: @alice
  Timebox: 1d
  Steps:
    - 创建 <Banner> 组件，ARIA role=alert
    - 在密码字段附近渲染，支持"关闭"
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