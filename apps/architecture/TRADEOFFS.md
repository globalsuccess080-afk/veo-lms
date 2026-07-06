# VeoLMS Trade-offs

Deliberate compromises made for a **production-like prototype** that must be explainable in a 90-minute technical review.

---

## 1. API + worker: separate process, not separate infra

**Choice:** `server.ts` runs API; `worker.ts` runs BullMQ consumers (video, email, export, certificates).

**Why:** FFmpeg transcoding blocks CPU. Isolating workers prevents API timeouts during uploads.

**Trade-off:** Two Railway services (or `dev:all` locally) vs one monolith. Extra ~$0–5/mo and one more deploy unit.

**Not chosen:** Kubernetes, separate EC2 transcode farm — overkill for 4 courses.

---

## 2. Video delivery: signed URLs, not DRM

**Choice:** Private R2 + JWT playlist proxy + per-segment presigned URLs.

**Why:** Industry-standard for non-DRM LMS; low cost; easy to demo.

**Trade-off:** Screen recording and temporary URL sharing remain possible.

**Not chosen:** Widevine/FairPlay DRM — complexity and cost far beyond challenge scope.

---

## 3. Segment proxy vs direct R2 delivery

**Choice:** API proxies **playlists only** (`.m3u8`). Segments (`.ts`) go directly to R2 via signed URLs.

**Why:** Playlists are small and need rewriting; segments are large and would burn API bandwidth.

**Trade-off:** Signed segment URLs valid for 2 hours (configurable). Leaked URL works until expiry.

**Not chosen:** Proxying every `.ts` through Express — rejected for cost and latency.

---

## 4. Video JWT vs segment expiry (asymmetric TTL)

| Token | TTL | Purpose |
|---|---|---|
| Video JWT (playlist) | 20 min (`VIDEO_TOKEN_EXPIRY_SECONDS=1200`) | Authorize playlist proxy requests |
| Segment signed URL | 2 hr (`VIDEO_SEGMENT_URL_EXPIRY_SECONDS=7200`) | Reliable pause/seek on long videos |

**Why:** Short JWT limits stolen playlist access. Longer segment URLs prevent mid-playback expiry failures.

**Trade-off:** Opposite of naive “one expiry for everything” — requires clear documentation (see `authentication-security-design.md`).

---

## 5. Storage path: `videos/{lessonId}/versions/{jobId}/hls/`

**Choice:** Predictable structure keyed by MongoDB `lessonId` + transcode job UUID.

**Why:** Simple debugging, re-upload versioning, no migration of existing data.

**Trade-off:** `lessonId` is enumerable if leaked; mitigated by enrollment + JWT + private bucket.

**Not chosen:** Fully random opaque paths — marginal security gain vs operational complexity for this prototype.

---

## 6. Redis: cache + queue + sessions in one instance

**Choice:** Single Redis URL for cache, BullMQ, refresh tokens, rate limits.

**Why:** Free tier (30 MB) fits prototype; one connection config.

**Trade-off:** Noisy neighbor inside Redis; job spikes share memory with cache.

**Not chosen:** Separate Redis for queues — unnecessary at demo scale.

---

## 7. MongoDB over PostgreSQL

**Choice:** Mongoose + flexible nested sections/lessons.

**Why:** Course curriculum maps naturally to embedded sections; rapid iteration.

**Trade-off:** Fewer relational guarantees; denormalized counts (`totalLessons`, `enrollmentCount`).

---

## 8. YouTube + HLS hybrid content

**Choice:** Seed lessons use YouTube embeds; admin uploads use FFmpeg → HLS → R2.

**Why:** Seed is fast and free; upload pipeline proves real engineering.

**Trade-off:** Two player code paths (YouTube iframe vs hls.js).

---

## 9. Optional RSA+AES payload encryption

**Choice:** `ENABLE_PAYLOAD_ENCRYPTION` — off by default in dev, available for defense-in-depth.

**Why:** Demonstrates security awareness without forcing crypto on every local request.

**Trade-off:** ~1–5 ms RSA overhead per encrypted request when enabled.

---

## 10. Rate limiting: IP-based, Redis-backed

**Choice:** `rate-limit-redis` store shared across API instances.

**Why:** Survives multi-instance Railway deploy; consistent auth brute-force protection.

**Trade-off:** Shared NAT IPs (offices, mobile carriers) may hit limits together.

**Not chosen:** Per-user rate limits on every endpoint — added complexity for marginal gain here.

---

## 11. No multi-region / no CDN for API

**Choice:** Single Railway region API; static frontend on Vercel edge.

**Why:** Evaluators are in one geography; API latency < 200 ms is sufficient.

---

## 12. Certificates, coupons, discussions — beyond minimum

**Choice:** Implemented as bonus depth.

**Why:** Shows product thinking; not required for pass/fail on mandatory checklist.

**Trade-off:** More surface area to explain in interview — document boundaries clearly.

---

## Lessons learned (for submission email)

1. **Video security is a pipeline problem** — auth at play time + private storage + signed segments, not a single middleware.
2. **Expiry tuning matters** — 5-minute segment URLs caused more UX bugs than security benefits.
3. **Workers must be isolated** — transcoding in the API process caused timeouts during testing.
4. **Tests must track real routes** — `/api/v1` drift broke CI until aligned with `/api/*`.

---

## Related docs

- [system-design-hld.md](./system-design-hld.md)
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md)
