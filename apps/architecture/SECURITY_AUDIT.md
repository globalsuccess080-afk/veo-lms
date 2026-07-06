# VeoLMS Security Audit

Concise security review for evaluators: what is protected, how, and what remains exposed by design.

---

## Threat model (prototype scope)

| Threat | Handled? | Mechanism |
|---|---|---|
| Unauthenticated API abuse | ✅ | JWT on protected routes, Redis-backed rate limits (`rateLimiter.ts`) |
| Brute-force login | ✅ | `authLimiter` (10 req / 15 min per IP), login attempt tracking in Redis |
| Student accessing admin routes | ✅ | `requireRole('admin')` middleware |
| Non-enrolled user watching paid lessons | ✅ | `checkAccess()` in `lesson.service.ts` before video URL |
| Payment forgery | ✅ | Razorpay HMAC signature verify, timing-safe compare, idempotent enrollment |
| XSS stealing refresh token | ✅ | Refresh token in httpOnly cookie; access token in memory (Zustand) |
| Stolen long-lived access JWT | ✅ | Short access token expiry (15m default) |
| PII leak from DB breach | ✅ | AES-256-GCM for email at rest + `emailHash` for lookup |
| Direct hotlink to private HLS | ✅ | Private R2 bucket + playlist JWT proxy + per-segment signed URLs |
| Path traversal on playlist proxy | ✅ | `normalizeStorageKey()` + storage prefix check in `video.delivery.ts` |
| SQL/NoSQL injection | ✅ | Mongoose ODM + Zod validation on inputs |
| CSRF on refresh cookie | ✅ | `SameSite=Strict` cookie policy |
| Screen recording / piracy | ❌ (accepted) | No DRM — documented limitation |

---

## Authentication & authorization

```
Register/Login → bcrypt(12) password hash
              → AES-GCM encrypted email in MongoDB
              → Access JWT (short) + Refresh JWT (httpOnly cookie, stored in Redis)
Protected route → auth.middleware → role.middleware → business logic
```

**Proof:** `apps/server/src/modules/auth/`, `authentication-security-design.md`

---

## Payment security

1. Order amount computed server-side from course price (not trusted from client).
2. `POST /api/payments/verify` validates Razorpay signature before enrollment.
3. Duplicate payment / double enrollment guarded in payment service.

**Proof:** `apps/server/src/modules/payment/payment.service.ts`

---

## Video content protection

```
GET /api/lessons/:id/video-url  (auth + enrollment)
  → short-lived Video JWT (20 min default)
  → player hits GET /api/videos/stream/{path}?token=JWT
  → proxy rewrites master (token on variants) or signs .ts segments (2h default)
  → segments fetched directly from private R2 (API does not proxy TS)
```

**Operational requirement:** R2 bucket must not expose `videos/*` via public domain. `R2_PUBLIC_URL` is for images/thumbnails only.

**Proof:** `video.delivery.ts`, `StorageService.ts` (private cache on `.m3u8` / `.ts`)

---

## API hardening

| Control | Implementation |
|---|---|
| Helmet + CSP | `apps/server/src/app.ts` — restricted `connectSrc`, Razorpay, R2 public URL |
| CORS | Allowlist: `FRONTEND_URL` (+ localhost in dev) |
| Rate limiting | Redis store: API 500/15m, auth 10/15m, payment 20/15m, upload 50/hr |
| Body size limit | `express.json({ limit: '10mb' })` |
| Optional payload encryption | RSA + AES-GCM middleware (`ENABLE_PAYLOAD_ENCRYPTION`) |

---

## Data encrypted at rest

| Field | Algorithm | Location |
|---|---|---|
| User email | AES-256-GCM | `user.model.ts` |
| Payment signature (where stored) | AES-256-GCM | payment model |

---

## Residual risks (honest)

| Risk | Severity | Mitigation / acceptance |
|---|---|---|
| Stolen Video JWT within 20 min | Medium | Short TTL; no DRM; acceptable for prototype |
| Leaked signed segment URL within 2h | Medium | URLs expire; bucket private; no permanent links |
| Screen recording | High (impact) | Accepted — same as Udemy without enterprise DRM |
| Redis / MongoDB misconfiguration in prod | High | Use managed Atlas + Redis Cloud with auth |
| Public R2 misconfiguration | High | Manual: disable public access on `videos/` prefix |
| No account lockout beyond IP rate limit | Low | IP + Redis counters; sufficient for challenge |
| Socket.IO token in handshake | Low | Same access JWT; short-lived |

---

## Security checklist for production deploy

- [ ] All secrets in env vars (never in git)
- [ ] `NODE_ENV=production`
- [ ] HTTPS on frontend and API
- [ ] R2 `videos/` prefix private
- [ ] MongoDB Atlas IP allowlist / auth
- [ ] Redis password enabled
- [ ] Razorpay **test** keys only (as required)
- [ ] CORS `FRONTEND_URL` set to deployed Vercel URL

---

## Related docs

- [authentication-security-design.md](./authentication-security-design.md) — full auth + encryption deep dive
- [TRADEOFFS.md](./TRADEOFFS.md) — why DRM and segment proxying were rejected
