# VeoLMS Cost Breakdown

Estimated monthly operating cost for the **prototype scale** defined in the challenge: 4 courses, ~44 lessons, demo traffic, test payments only.

All figures in INR are approximate (₹83 ≈ $1 USD).

---

## Services used

| Service | Role | Tier used |
|---|---|---|
| Vercel | React SPA hosting + CDN | Free |
| Railway | Express API + worker process | Hobby (~$5/mo) |
| MongoDB Atlas | Primary database | M0 Free (512 MB) |
| Redis Cloud | Cache, sessions, BullMQ, rate limits | Free (30 MB) |
| Cloudflare R2 | HLS video, thumbnails, uploads | Free 10 GB storage |
| Cloudflare CDN | Asset delivery (via R2 public domain for images) | Free |
| Razorpay | Test-mode payments | Free |
| SMTP (Gmail / Ethereal) | Transactional email | Free / negligible |

---

## Monthly estimate

| Service | Free tier limit | Expected usage (prototype) | Cost if within free tier | Cost if exceeded |
|---|---|---|---|---|
| Vercel | 100 GB bandwidth | < 5 GB | **₹0** | Rare on demo traffic |
| Railway API + worker | Hobby usage | 1 web + 1 worker service | **~₹400** ($5) | +usage if always-on transcode heavy |
| MongoDB Atlas M0 | 512 MB | < 50 MB | **₹0** | M2 ~₹750/mo if scaled |
| Redis Cloud | 30 MB | < 10 MB | **₹0** | ~₹580/mo if exceeded |
| Cloudflare R2 | 10 GB storage, no egress fee | 2–8 GB video | **₹0** | ~₹1.25/GB/month storage only |
| Razorpay | Test mode | Unlimited test | **₹0** | N/A (no live payments) |
| Email SMTP | Provider limits | Low volume | **₹0** | Negligible |

### Total estimated monthly cost

| Scenario | Monthly cost |
|---|---|
| **Best case (free tiers + Railway Hobby)** | **₹0 – ₹500** |
| **Realistic prototype (Railway always on)** | **₹400 – ₹700** |
| **If video storage > 10 GB** | +₹15–50 per extra GB on R2 |

---

## Why these services were chosen

### Cloudflare R2 (not AWS S3)
- **No egress fees** — critical for video delivery cost.
- S3 egress at scale can exceed storage cost; R2 + CDN fits LMS video prototype.

### Railway (not separate EC2 for FFmpeg)
- Single deploy target for API; worker runs as second process (`npm run start:worker`).
- Ephemeral `/tmp` for upload → transcode → R2 pipeline without persistent disk.
- Trade-off: shared CPU; acceptable for ~50 videos, not for mass transcoding.

### MongoDB Atlas M0
- Flexible schema for courses, sections, progress, notifications.
- Free tier sufficient for seed data + demo users.

### Redis (one instance, three roles)
- Cache (course lists), session store (refresh tokens), BullMQ queues, rate limiting.
- Avoids paying for separate cache + queue services at prototype scale.

### Vercel (frontend)
- Zero-config Vite builds, global CDN, preview deployments per PR.

---

## Cost optimization decisions in code

| Decision | Saves |
|---|---|
| Redis cache on public course routes | Fewer MongoDB reads → smaller Atlas need |
| BullMQ async video transcode | API stays responsive; no second always-on transcode server |
| HLS segments served from R2 directly | Zero API bandwidth for `.ts` files |
| YouTube embeds in seed content | No storage/transcode cost for demo lessons |
| FFmpeg on-demand (worker picks jobs) | No dedicated video processing cluster |

---

## Assumptions

- ≤ 10 GB total video on R2
- < 1,000 monthly active users during evaluation
- No live streaming, no multi-region deployment
- Test payments only (no Razorpay live fees)
- One Railway project (API + worker), not Kubernetes

---

## What would increase cost (out of scope)

| Change | Impact |
|---|---|
| DRM (Widevine/FairPlay) | License server + integration cost |
| Proxying all video through API | Railway bandwidth charges spike |
| Multi-region Redis/MongoDB | 3–10× infra cost |
| Always-on dedicated transcode server | +₹3,000–8,000/mo |

---

## Related docs

- [performance-scalability-optimization.md](./performance-scalability-optimization.md)
- [TRADEOFFS.md](./TRADEOFFS.md)
- [system-design-hld.md](./system-design-hld.md)
