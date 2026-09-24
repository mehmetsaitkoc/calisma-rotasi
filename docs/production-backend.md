# Persistent backend release requirements

The code adds real accounts and SQLite-backed student records, but no production database/disk was provisioned, no secrets were read, and no deployment was performed. The current committed Render free-service blueprint does not supply a durable disk. **Do not deploy the account release until durable storage, backup and origin settings are configured and restart recovery is verified.**

## Required runtime configuration

- Node 24 with built-in `node:sqlite`; no new package dependency. SQLite uses WAL, foreign keys and immediate transactions.
- `ROTA_DB_PATH`: absolute path on a mounted durable disk, outside the application checkout and temporary directories. Production (`RENDER=true` or `NODE_ENV=production`) fails startup without this. Local development defaults to `work/local-data/rota.sqlite`; do not commit that directory or any SQLite/WAL/SHM file.
- `ROTA_APP_ORIGIN`: exact HTTPS application origin; Render's `RENDER_EXTERNAL_URL` is a fallback. Production fails startup if neither exists.
- `ROTA_ALLOWED_ORIGINS`: optional comma-separated exact origins. Add `https://localhost` only when distributing the reviewed Android client. Do not use `*`.
- `OPENAI_API_KEY` only in the server secret environment. `ROTA_AI_MODEL` explicitly selects the model; no runtime automatic fallback chain is used. Default economy model remains `gpt-5.6-luna`. `ROTA_TTS_MODEL` defaults to `gpt-4o-mini-tts`. `OPENAI_BASE_URL` is an operator setting, never read from a request.
- `ROTA_PROVIDER_TIMEOUT_MS`: optional provider deadline, default 45000. Runtime AI configuration is disabled on every production host. Any remaining development-only loopback endpoint requires authenticated same-origin/CSRF-protected access; no student UI exposes API-key entry.

The initial deployment supports one application instance attached to one durable SQLite disk. Do not horizontally scale onto independent local databases. Per-account/global daily usage and workspace revisions are transactional in SQLite; the eight-job in-flight limiter is process-local. Migrating to multiple application instances requires a shared datastore/coordination layer and deployment-specific tests.

Render filesystems are ephemeral by default and free web services do not support persistent disks. A path string alone cannot prove that the operator mounted durable storage. Verify the mount and an actual restart/redeploy recovery before launch. [Render disks](https://render.com/docs/disks), [Free service limitations](https://render.com/docs/free).

Take encrypted, access-controlled backups using SQLite's supported backup mechanism or a consistent snapshot of the database; do not copy only the main SQLite file during WAL activity. Document retention, restoration and account-deletion treatment in backups. Test a restoration to a separate environment. The API export is account-scoped and excludes password hashes/session tokens.

For the documented offline procedure, stop the application, open the database with SQLite, complete `PRAGMA wal_checkpoint(TRUNCATE)`, close the connection, then back up the database with its restrictive permissions. Restore that backup to a separate durable path while the application is stopped; do not mix old WAL/SHM sidecars with the restored database. Start against the restored path and verify account login, workspace revision and records. The fixture security test performs checkpoint → offline copy → restore → restart and verifies the prior session and workspace. This proves the code path, not any unprovisioned Render disk or production backup policy.

## Provider verification

Official documentation checked on 2026-09-24 lists both [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) and [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra) as API model IDs. That does not establish this deployment account's access. Astra does not support `none` reasoning; automatic selection sends at least `low` for the GPT-6 family. An explicit reasoning override must be supported by the selected model. [Reasoning documentation](https://developers.openai.com/api/docs/guides/reasoning).

Tests use only a fake local provider and fixture key. Real account/model access, photo-answer quality, provider billing limits and speech playback must be verified separately by the operator before enabling the feature in production. A configured key is not proof that the model works. Without a key, the response clearly reports unavailability and contributes no fabricated learning evidence. Model errors are not retried across a series of potentially unsupported models.

## Verification commands

`node scripts/account-security.test.mjs` uses an isolated temporary SQLite database and loopback fake provider. It covers two accounts, cookie/native sessions, CSRF/CORS, password hashing, revision conflicts, idempotent retry, restart/second-device recovery, provider authentication/context/timeout, export and password-confirmed account deletion. It also runs the request-streaming revocation and unsaved-memory account-client regressions. No live student records or real AI requests are used.

`node scripts/server-runtime.test.mjs` checks authenticated unavailable-mode behavior, request bounds, server feature policy and rate limits. Frontend and Android tests must additionally verify secure token storage, account-scoped offline queues, explicit guest migration and unsynced-work preservation at logout/conflict.

Email verification and forgotten-password flows are implemented with hashed, expiring one-use tokens and a Resend HTTP transport. `ROTA_MAIL_PROVIDER=resend`, `ROTA_MAIL_API_KEY`, `ROTA_MAIL_FROM` (verified sender domain), and the application origin are required to enable delivery. Missing configuration returns `FEATURE_UNAVAILABLE`. No real email was sent during implementation. The privacy-contact Gmail address is not assumed to be an authorized sending domain.

`node scripts/account-mail.test.mjs` uses only a loopback mock and covers exact generic recovery responses, purpose/expiry/single-use tokens, concurrent redemption, restart, provider failure/timeout, disabled configuration and revocation of all sessions on reset. Test endpoint overrides are rejected outside `NODE_ENV=test` and outside loopback. The implementation follows Resend's documented [send-email API](https://resend.com/docs/api-reference/emails/send-email), checked 2026-09-24. Real provider credentials/domain verification and delivery testing remain deployment requirements.

## Privacy and store publication gate

`/privacy.html` documents the implemented data flow, optional AI/photo/speech transfer and export/deletion controls. `/delete-account.html` provides a standalone browser login, account export and password-confirmed deletion without installing the Android app. They are present in this checkout, not deployed URLs.

The user confirmed developer/operator **Yasin Koç** and privacy contact `mehmetsaitkoc113@gmail.com`; both standalone pages now identify them. Hosting/provider retention details and the backup deletion/restore policy remain unspecified. The pages explicitly identify these remaining pre-release limitations. **Do not claim legal completeness or submit the Play listing until these are completed and the actual hosted links are verified.** An accessible deletion pathway and developer/privacy contact are required by Google's current [account deletion guidance](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en) and [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en-GB), checked 2026-09-24.

Account deletion removes its identified usage records. A separate daily global count contains no account identifier and remains after deletion, so repeated account deletion cannot reset the service's paid-provider spending limit.
