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