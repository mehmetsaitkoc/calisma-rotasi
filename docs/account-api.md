# Account and workspace API

All bodies are JSON. Errors use `{error,code}`. The owner is always derived from the authenticated session; supplied user IDs never select a workspace. This first cloud release stores KPSS only. Existing anonymous local data must be attached to an account only after explicit migration consent.

Authenticated clients send `X-Rota-Account-Id` with the account currently displayed. The server treats this solely as an expectation: if it differs from the session owner, it returns `409 ACCOUNT_MISMATCH` before reading or writing account data or calling AI. This protects an older tab when a different tab changes the shared cookie. It never grants access to the supplied ID. Native CORS permits the header. The client preserves its pending changes and asks for renewed login on a mismatch.

## Authentication

| Request | Body | Success |
| --- | --- | --- |
| `POST /api/auth/register` | `{email,password,name,sessionTransport?}` | 201, session response |
| `POST /api/auth/login` | `{email,password,sessionTransport?}` | 200, session response |
| `GET /api/auth/me` | none | 200, user + CSRF + expiry |
| `POST /api/auth/refresh` | `{}` | 200, rotated session; old token revoked |
| `POST /api/auth/logout` | `{}` | 200 `{ok:true}`; current session revoked |
| `POST /api/auth/profile` | `{name}` | 200 `{user}` |
| `POST /api/auth/recovery` | `{email}` | 202 generic recovery-request acknowledgement |
| `POST /api/auth/reset` | `{token,password}` | 200 `{ok:true}`; one-use token consumed, all sessions revoked |
| `POST /api/auth/verify` | `{}` with session or `{token}` without session | 202 send acknowledgement, or 200 `{ok:true,user}` on token consumption |
| `GET /api/account/export` | none | account export with user and workspace snapshot |
| `DELETE /api/account` | `{password}` | 200 `{ok:true,deleted:true}`; account and owned records/sessions deleted |

Session response: `{user:{id,email,name,emailVerified},csrfToken,expiresAt,features:{emailVerification,passwordRecovery}}`. Feature flags are true only when the mail provider, key, sender and application origin are configured; they do not prove delivery or provider account access.

Browser sessions use an HttpOnly, SameSite=Lax cookie, Secure in production. Send `X-CSRF-Token` and the same Origin on mutating requests; GET `/me` returns the current stable CSRF value. Refresh rotates both session and CSRF. Authentication is not stored in localStorage.

Native clients request `sessionTransport:'bearer'` at registration/login. Their response additionally contains `sessionToken`. Store it in the platform's secure storage; send `Authorization: Bearer <sessionToken>` thereafter. Bearer requests do not use CSRF tokens. A supplied Origin must be on the exact allowlist; the Android WebView origin `https://localhost` must be explicitly configured. Refresh returns a new `sessionToken`; atomically replace the old secure value.

Password length is 12–128 characters, name 1–60, email maximum 254. Email is normalized to lowercase and remains unverified until the verification token is consumed. Registration itself sends no message; the student explicitly requests verification. Missing mail configuration returns 503 `FEATURE_UNAVAILABLE` for delivery requests. A configured recovery request has the same generic 202 response for an existing address, an unknown address and a failed delivery attempt; it does not assert account existence or delivery. Authenticated verification send can report a provider failure directly. Requests are limited per IP/address, with persistent per-account/day and global/day mail caps of 20/300.

Reset/verify token consumption accepts public JSON POSTs with an allowed Origin; cookie CSRF is not required because the 256-bit one-use token is the authority. Tokens are hashed in SQLite, bound to a purpose, and expire after 30 minutes for reset or 24 hours for verification. Password reset checks validity again inside the final transaction after asynchronous scrypt and revokes every session and outstanding account token. Emailed links use `/account-action.html#mode=reset|verify&token=...` so the token is absent from HTTP access logs; opening the page alone must not consume it. The standalone page removes the fragment from browser history after parsing and keeps it only in memory.

## Workspace

`GET /api/workspace` returns `{revision:0,data:null,updatedAt:0}` for a new account, otherwise the current snapshot.

`PUT /api/workspace` body:

```json
{"baseRevision":0,"mutationId":"unique-client-operation-id","data":{"workspace":{},"teacherHistory":[],"preferences":{}}}
```

`workspace` must be the actual KPSS workspace produced by `RotaWorkspaceSchema`/validated by `RotaCore`, including settings, profile, topicState, plan/log/exam/assessment/mistake/task-event arrays and route state. It is not the entire KPSS+YKS backup wrapper. Server validation enforces shape, limits, KPSS identities and record IDs. `teacherHistory` is the account's maximum 60 teacher records, including answers and follow-ups; image thumbnails must be JPEG/PNG/WebP data URIs, at most 400 KiB each. JSON request ceiling is 12 MiB. Preferences are included in the same revision.

Success: `{revision,data,updatedAt}`. A repeated identical mutation returns its original `{revision,data,updatedAt,duplicate:true}` without changing the current database. If later revisions exist, that replay response does not mean those later revisions should be discarded. Same mutation ID with different content returns 409 `IDEMPOTENCY_CONFLICT`.

Stale `baseRevision`: 409 `{code:'REVISION_CONFLICT',error,revision,data,updatedAt}`. The client must preserve pending work and reconcile explicitly; the server performs no blind merge. Reuse the same mutation ID for an uncertain retry, use a new ID after a deliberate merge. `Idempotency-Key` is accepted when the JSON mutationId is omitted.

Teacher/TTS POSTs require the same account authentication and browser CSRF. Per account: 20 teacher/36 TTS requests per minute, 50/100 per UTC day, maximum two in flight. Global daily caps are 500 teacher/1000 TTS calls, with eight concurrent jobs in one process. Daily quota is transactionally persisted in SQLite. Timeout defaults to 45 seconds, configurable with `ROTA_PROVIDER_TIMEOUT_MS` (production 5–90 seconds). Upstream failures are returned without provider-private text; no answer is fabricated.

No client is authorized by `accountRequired:true` or an entitlement flag alone. Missing/expired sessions return 401. Invalid Origin or browser CSRF returns 403 before write/provider work. Preflight supports Authorization, Content-Type, X-CSRF-Token, X-Rota-Account-Id and Idempotency-Key with exact CORS origins, never a wildcard.
