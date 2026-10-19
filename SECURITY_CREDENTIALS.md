# Credentials and secure review login

The review password is configured using `DLMM_REVIEW_PASSWORD` from the process environment. The fallback review login is disabled when this value is missing. Use a new random password, not the value found in earlier Git history.

In production, `DLMM_SESSION_KEY` is mandatory. Generate and store a cryptographically strong random value in the deployment secret store. Changing it invalidates existing sessions.

Store runtime credentials only in your protected deployment configuration or local untracked `.env`. Set both values in the running service before releasing this change; otherwise fallback review login will be unavailable and production sessions will fail without a signing key.

Historical commits may contain old credentials. Rotate the old review password anywhere it is still accepted and review deployment logs and access if the app was publicly reachable.

The former PostgreSQL example used a fixed database password and seeded an account with a published password hash. New database initialization no longer seeds that account. Before deploying against **any existing database**, revoke or reset the old seeded review account through a database administrator, rotate the `dlmm_review` role password in PostgreSQL, and update all clients together. Changing `POSTGRES_PASSWORD` in Compose does **not** change the password in an existing PostgreSQL data volume. Do not delete an existing database volume as a rotation shortcut.

For Docker Compose, provide a new random `DLMM_DB_PASSWORD` and a matching `DLMM_DATABASE_URL` pointing at `postgres:5432/dlmm_thesis` with username `dlmm_review`. URL-encode special characters in the connection URI. Keep both values untracked and private. For non-Docker operation, set `DATABASE_URL` only if PostgreSQL is required. The default snapshot walkthrough works without PostgreSQL.
