# veoLMS System Design: High Level Architecture

This document explains the big picture of how every part of veoLMS connects together. Anyone reading this should understand what each piece does, why it exists, and exactly how data flows from a student clicking a button to a response appearing on screen.

---

## The Core Architecture: Separation of Concerns

The entire system is built on one principle: **no single service should carry more than one responsibility**. The main Express API handles fast request/response. Redis handles speed and queuing. MongoDB handles persistence. Background Workers handle heavy lifting. Cloud Storage handles files. This way, if one part is under heavy load, the others are not affected.

```
[Student Browser]  ──► [Vite React Client]
                              │
                              ▼
                    [Express API Server]  ──► [MongoDB Atlas]
                              │                      ▲
                              ├──► [Redis]           │
                              │     ├── Cache         │
                              │     ├── OTP/Sessions  │
                              │     └── Job Queues ──► [BullMQ Workers]
                              │                              │
                              └──► [AWS S3 / R2]  ◄──────────┘
                                   (Videos, Images)
```

---

## Layer 1: The Client (Vite + React)

**What it does:**
- Serves the entire student and admin interface as a Single Page Application (SPA).
- Communicates with the backend exclusively through REST API calls over HTTPS.
- Streams HLS video chunks directly from cloud storage (S3/R2) — it never fetches video through the API server.

**The Trade-off:**
- **Downside:** As a SPA, the initial page load requires downloading the JavaScript bundle. However, Vite's code-splitting ensures only the required code for each route is loaded.
- **Upside:** After the first load, navigation is instant. There are no full page reloads. This gives the app a native-app feel.

---

## Layer 2: The Express API Server (Node.js)

**What it does:**
- The single entry point for all client requests. Every API route lives here.
- Handles authentication (JWT verification), request validation (Zod schemas from the shared package), rate limiting, and CORS enforcement.
- All heavy work (video processing, emails, PDF generation, exports) is immediately offloaded to BullMQ queues. The API only adds a job to the queue and responds instantly.
- Uses `compression` middleware to gzip all API responses, reducing network payload.

**The Trade-off:**
- **Downside:** Node.js is single-threaded. If a synchronous operation were to run for a long time (e.g., generating a report), it would block all other requests. This is exactly why we offload everything heavy to workers.
- **Upside:** For I/O-bound tasks (reading from database, reading from Redis), Node.js is extremely efficient. The event loop handles thousands of concurrent I/O operations without spinning up new threads.

---

## Layer 3: Redis (Cache + Queue + Session Store)

Redis serves three completely different but equally important roles in veoLMS:

| Role | What it stores | TTL |
|---|---|---|
| **Cache** | Course listings, featured courses, category lists, coupon data, analytics dashboard | 5 min – 1 hour |
| **Session Store** | JWT refresh tokens, OTPs, password reset OTPs, login attempt counters | 10 min – 7 days |
| **Job Queue** | BullMQ job payloads for video transcoding, emails, certificates, exports, announcements | Until processed |

**The Trade-off:**
- **Downside:** Redis is an in-memory store. If the Redis server crashes without persistence enabled, all cached data and pending jobs are lost. In production, Redis persistence (AOF or RDB snapshots) should be enabled.
- **Upside:** Redis reads are hundreds of times faster than MongoDB reads. By putting the most-accessed data in Redis, we ensure the database is only consulted when truly necessary.

---

## Layer 4: MongoDB (Persistent Data Store)

**What it stores:** All permanent application data — Users, Courses, Lessons, Enrollments, Payments, Progress, Certificates, Notifications, Discussions, Notes, Coupons, Announcements.

**Key design decisions at this layer:**
- **Text index** on Course (`title`, `description`, `tags`) enables full-text search with MongoDB's `$text` operator — no external search engine needed.
- **Compound indexes** enforce business rules at the database level (e.g., one enrollment per user per course).
- **`.lean()` on all reads** — Mongoose documents have significant overhead. For all read-only API responses, `.lean()` returns plain JavaScript objects, which are 2-5x faster.

**The Trade-off:**
- **Downside:** MongoDB is not a relational database. Cross-collection joins (`$lookup`) are slower than SQL joins. We minimized this by denormalizing frequently-read aggregated values (enrollment count, rating) directly onto the Course document.
- **Upside:** MongoDB's flexible schema is perfect for an LMS where different courses may have different structures, and the document model maps naturally to the JSON that the API returns.

---

## Layer 5: BullMQ Workers (Async Processing)

We run six separate background workers, each responsible for one domain:

| Worker | Queue Name | What it processes |
|---|---|---|
| `transcodeWorker` | `video-transcode` | FFmpeg HLS transcoding per quality rendition |
| `uploadWorker` | `video-upload` | Uploading transcoded HLS chunks to cloud storage |
| `emailWorker` | `email` | Sending all emails via SMTP (OTP, welcome, receipt, certificates) |
| `courseWorker` | `course` | Bulk course delete, enrolled-student email notifications |
| `announcementWorker` | `announcement` | Batched notification fan-out + scheduled delivery |
| `certificateWorker` | `certificate-generate` | PDF certificate generation + email dispatch |
| `adminWorker` | `admin-export` / `admin-import` | Excel export/import of students, courses, enrollments |

**The Trade-off:**
- **Downside:** Workers are separate processes. They need monitoring. If a worker process crashes, jobs in `active` state will be re-queued after the `lockDuration` expires (configured to 10 minutes for video jobs to handle long transcodes).
- **Upside:** The main API server is completely isolated from all heavy operations. Workers can be scaled independently — if video processing is slow, we can add more transcode worker instances without touching the API.

---

## Layer 6: Cloud Storage (S3 / R2)

**What it stores:** All binary files — processed HLS video chunks, video thumbnails (small/medium/large per lesson), course thumbnails, user avatars, lesson resource files.

**How video files are served:**
- The API never proxies video data. Video chunks are served directly from cloud storage to the student's browser.
- Each chunk URL is a time-limited pre-signed URL generated by the server on every playlist request. URLs expire after a configurable number of seconds (`VIDEO_SEGMENT_URL_EXPIRY_SECONDS`).
- This means even if a student copies a chunk URL, it is useless after a few seconds.

**The Trade-off:**
- **Downside:** Cloud storage costs money per GB stored and per GB transferred. The system stores multiple quality renditions (e.g., 1080p, 720p, 480p) for each video, which multiplies storage costs.
- **Upside:** Infinite scalability. The API server's bandwidth is completely free of video data. All video delivery is handled by the CDN-accelerated cloud storage infrastructure.
