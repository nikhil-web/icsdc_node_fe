# Future Enhancements

Planned but not yet implemented. Each entry is a ready-to-execute plan.

---

## 1. Strapi Content Audit Log — record every content change (who / what / when)

**Status:** Planned (2026-07-03). Not implemented.
**Trigger:** The 2026-06-25 homepage wipe — a Publish on a stale draft/form nulled 18 seeded fields, and there was no way to tell who or what caused it. Strapi Community Edition has no audit log (Enterprise-only feature).

### Key facts
- Local and prod Strapi share **one Postgres DB** (`160.25.110.10/strapi_db`) — a single audit table captures writes from both instances.
- The Node app's `DATABASE_URL` points at the **same DB** (chat sessions already live there via its `pg` pool) — the existing admin panel can read the audit table directly, no new infra.
- Strapi v5 (`my-admin`, TypeScript) `src/index.ts` has `register()`/`bootstrap()` hooks — the v5 **Document Service middleware** (`strapi.documents.use(...)`) intercepts every content operation from both the admin panel and the REST API.

### Design

**1. Strapi side — capture** (`ICSDC Strapi CMS/my-admin/src/index.ts`)

Create the table in `bootstrap()` (idempotent, via `strapi.db.connection` = knex):

```sql
CREATE TABLE IF NOT EXISTS content_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
  uid         TEXT NOT NULL,          -- e.g. api::home-page.home-page
  document_id TEXT,
  action      TEXT NOT NULL,          -- create | update | delete | publish | unpublish | discardDraft
  user_email  TEXT,                   -- admin user (null for API-token writes)
  source      TEXT,                   -- 'admin' | 'api' | 'unknown' (from request path)
  changed_keys TEXT,                  -- comma list of top-level fields in the payload
  payload     JSONB,                  -- the incoming data (what it was changed TO)
  before      JSONB,                  -- pre-change snapshot (update/publish/delete only)
  ok          BOOLEAN,
  error       TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_ts  ON content_audit_log (ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_uid ON content_audit_log (uid);
```

Register the middleware in `register()`:

```ts
strapi.documents.use(async (ctx, next) => {
  const AUDITED = ['create','update','delete','publish','unpublish','discardDraft'];
  if (!AUDITED.includes(ctx.action) || !String(ctx.uid).startsWith('api::')) return next();
  const reqCtx = strapi.requestContext.get();
  const user   = reqCtx?.state?.user?.email ?? null;            // admin-panel user
  const source = reqCtx?.request?.url?.startsWith('/content-manager') ? 'admin'
               : reqCtx?.request?.url?.startsWith('/api/') ? 'api' : 'unknown';
  let before = null;
  if (['update','publish','delete'].includes(ctx.action)) {
    try {
      before = ctx.params?.documentId
        ? await strapi.documents(ctx.uid).findOne({ documentId: ctx.params.documentId })
        : await strapi.documents(ctx.uid).findFirst({});          // single types
    } catch {}
  }
  let ok = true, error = null, result;
  try { result = await next(); } catch (e) { ok = false; error = e.message; throw e; }
  finally {
    strapi.db.connection('content_audit_log').insert({
      uid: ctx.uid, document_id: ctx.params?.documentId ?? before?.documentId ?? null,
      action: ctx.action, user_email: user, source,
      changed_keys: Object.keys(ctx.params?.data ?? {}).join(','),
      payload: JSON.stringify(ctx.params?.data ?? null),
      before: JSON.stringify(before), ok, error,
    }).catch((e) => strapi.log.warn('[audit] insert failed: ' + e.message));
  }
  return result;
});
```

Notes:
- Filter to `api::*` uids only — skips admin/plugin internals (sessions, permissions) noise.
- Audit insert is fire-and-forget in `finally` — a logging failure can never block a save.
- Middleware goes in `register()` so it wraps the document service from boot.

**2. Node admin side — view**
- `server.js`: `GET /api/admin/audit?limit=100&uid=&action=` (next to other admin routes ~line 890, `requireAdminAuth`) → SELECT from `content_audit_log` via the **existing pg pool** used by chat (reuse it — no second pool), newest first, optional filters.
- Admin panel "Audit" tab — mirror the Prerender/Robots tab pattern:
  - `public/admin/index.html`: nav tab `data-tab="audit"` + `<main id="view-audit">` — filter row (content-type dropdown, action dropdown, Refresh) + table: Time · User · Source · Content type · Action · Changed fields. Row click → expandable `<pre>` with payload/before JSON.
  - `public/admin/admin.js`: `isAuditPath()`, route branch in `applyRoute()` (reload on every visit, like prerender), `loadAudit()`, `initAuditControls()` — all via the existing `apiFetch` helper.

**3. Retention** — in the same `bootstrap()`: `DELETE FROM content_audit_log WHERE ts < now() - interval '180 days'`.

### What it answers
"Home page went blank" → Audit tab → `publish · api::home-page.home-page · user@x.com · source=admin`, with `before` JSON showing the fields that had values and `payload` showing the nulls. Who, when, what, from which panel.

### Limits
- Captures changes made **through Strapi** (admin panel + REST API). Direct SQL writes bypass it.
- Middleware must be deployed to **both** Strapi installs (local + prod) — separate processes, shared table.
- Historic changes (incl. the June 25 wipe) are not recoverable — logging starts at deploy.

### Verification (when implemented)
1. Restart local Strapi → table exists in Postgres.
2. Admin edit (reload form first!) → row with `user_email`, `source=admin`, correct `changed_keys`.
3. API PUT → row with `source=api`, `user_email` null.
4. Node admin Audit tab renders rows; filters work; rows expand.
5. Publish → distinct `publish` row (the June-25 event type).
6. Deploy: prod Strapi `npm run build` + restart; prod Node restart.

---

## 2. Restrict the /api/strapi proxy (SECURITY)

**Status:** Acknowledged, deferred by user (2026-07-03).
The proxy (`server.js` ~line 61) forwards **all** HTTP methods with the server-side admin token — anyone on the internet can write to Strapi through it. Restrict to GET + the specific POSTs the public forms need (`contact-submission`, `whatsapp-lead`, `chat-session` create/update). See Known Issues in CLAUDE.md.

---

## 3. Strapi publish webhook → prerender rebuild

**Status:** Idea.
Snapshots go stale after CMS edits until someone clicks Rebuild in the admin Prerender tab. A Strapi webhook on publish events could POST to `/api/admin/prerender` (would need a token-authenticated variant) to rebuild the affected page automatically.
