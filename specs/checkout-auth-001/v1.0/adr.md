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