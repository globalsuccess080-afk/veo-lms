# How veoLMS Stays Fast Under Heavy Load: Async Design, DB Optimization & Scalability

Most applications work perfectly fine for 10 users. The real engineering challenge is making the same application work smoothly for 1,000 users doing completely different things at the exact same moment — one student watching a video, another paying for a course, an admin deleting 50 old courses, and another student receiving a welcome email.

This document explains **exactly** how veoLMS is engineered to handle all of this without slowing down or crashing. Every point below is backed by real code in our application.

---

## 1. The Course Catalog Problem: Why We Cache With Redis

**The Problem:**

Every student who visits the homepage loads the course listing page. In a normal system, every single visit fires a database query — MongoDB has to search through all courses, filter published ones, sort them, and count the total. If 200 students open the homepage at the same time, that is 200 database queries happening simultaneously, which spikes the database CPU and slows down the entire system.

**What We Did:**

We built a `CacheService` on top of Redis (`src/utils/cache.ts`). The `getOrSet` function works like this:
- The first student who loads the course listing fires a real MongoDB query. The result is saved in Redis with a key like `courses:list:1:12:all` and a TTL (Time to Live) of **300 seconds (5 minutes)**.
- Every other student who loads the page within those 5 minutes gets the answer from Redis, which reads from RAM and responds in under **1 millisecond**. MongoDB is never touched again.

We applied this pattern on every expensive read:
- `courses:featured` — cached for **10 minutes**
- `courses:categories` — cached for **1 hour** (categories barely change)
- `courses:slug:{slug}` — individual course pages cached for **5 minutes**

**What Happens When Data Changes:**

When an admin updates or publishes a course, we call `invalidateCache()` which runs `cache.del()` and `cache.delPattern('courses:list:*')` to instantly wipe the old cache. The next student who visits gets fresh data and a new cache is set.

**The Trade-off:**

- **Downside:** Students could see course data that is up to 5 minutes old. This is called "Eventual Consistency." If an admin corrects a course title, it won't appear instantly for students already browsing.
- **Upside:** The database receives 95% fewer read queries. The site feels instant for everyone, even under heavy traffic. For an LMS — where course content doesn't change every second — a 5-minute cache window is perfectly acceptable.

---

## 2. The Admin Bulk Delete Problem: Why We Use `deleteMany` and Background Workers

**The Problem:**

An admin decides to delete 10 old courses from the admin panel in a single selection. Each course has 30 lessons inside it. A beginner would write a `for` loop — loop through each course, delete it, then loop through each lesson, delete it. This creates **300 separate database network round-trips** (10 courses × 30 lessons). During this time, the Node.js server is blocked, the database is hammered, and students trying to browse or pay for courses experience timeouts.

**What We Did — Part 1: Bulk Operations**

For single course deletion, when an admin deletes a course (`course.service.ts: deleteCourse`), we use:

```
await Lesson.deleteMany({ courseId: id })
```

Instead of looping through each lesson individually, `deleteMany` sends **one single database command** that deletes all lessons for that course. The database does the heavy lifting internally, without multiple network trips.

Similarly, when deleting a section inside a course, we use:

```
await Lesson.deleteMany({ sectionId })
```

Again — one command instead of many.

**What We Did — Part 2: BullMQ Background Queue for Bulk Delete**

When an admin selects and deletes **multiple courses at once** (`course.service.ts: deleteCourses`), we do something even smarter. Instead of doing any database work immediately, we just push a job into the BullMQ Queue:

```
await courseQueue.add('bulk_delete', { action: 'bulk_delete', ids })
```

The API returns a success response to the admin in **milliseconds**. The admin sees "Deleted successfully" instantly.

In the background, our `course.worker.ts` wakes up and processes the job:

```
await Course.deleteMany({ _id: { $in: ids } })
await Lesson.deleteMany({ courseId: { $in: ids } })
```

All courses and all their lessons are deleted in **2 bulk database operations**, not hundreds. While this is happening, the main API server is completely free to serve students.

**The Trade-off:**

- **Downside:** The actual data deletion is not immediate. There is a small delay (a few seconds) before the data is fully removed from the database. Also, bulk operations skip Mongoose's per-document middleware hooks (like `pre('save')`), so we had to manually handle any cleanup logic (like cache invalidation and S3 file removal) inside the worker itself.
- **Upside:** The main server stays completely responsive. Students buying courses, watching videos, or logging in are completely unaffected by the admin's bulk delete. This is what makes the system "Admin-proof" — no admin action can slow down the student experience.

---

## 3. The Video Progress Problem: Why We Use `upsert` + Fire-and-Forget

**The Problem:**

When a student watches a lesson, the frontend sends a progress update to the backend every few seconds with how many seconds they have watched. If 500 students are watching at the same time, that is **hundreds of database write operations per second**. If we store this progress inside the `User` document or the `Enrollment` document, every 5 seconds we would be updating the same critical documents that are used for login, payment checks, and enrollment verification. This causes MongoDB "write contention" — documents get locked, queries queue up, and the whole system slows down.

**What We Did:**

We created a completely separate, isolated `Progress` collection. Inside `progress.service.ts`, the `updateProgress` function uses a single MongoDB `findOneAndUpdate` with `upsert: true`:

```
await Progress.findOneAndUpdate(
  { userId, courseId, lessonId },   // find by this
  { watchedSeconds, isCompleted, lastWatchedAt },  // update with this
  { upsert: true, new: true }   // create if it doesn't exist
)
```

`upsert: true` means: if a progress record already exists, update it. If it doesn't exist yet (first time watching), create it. This is one atomic operation — no need to check first, then insert or update separately.

**The Learning Streak is Fire-and-Forget:**

After saving progress, we also need to update the student's learning streak (how many days in a row they have studied). This is a separate, heavier operation. We deliberately do NOT await it:

```
updateLearningStreak(userId).catch(console.error)
```

This is called "fire-and-forget." The progress response is sent back to the student immediately. The streak calculation runs in the background. If the streak update fails for some reason, we catch the error silently and log it — the student's video progress was already saved, and the failure of a non-critical feature does not crash the main flow.

**The Trade-off:**

- **Downside:** Streak data might be updated a fraction of a second after the progress is saved. There is a tiny inconsistency window, though it is completely invisible to the user.
- **Upside:** The critical `User`, `Course`, and `Enrollment` collections are never touched during heavy video streaming. Hundreds of progress updates per second are absorbed by the isolated `Progress` collection without affecting anything else in the application.

---

## 4. The Email Problem: Why All Emails Go Through a Queue

**The Problem:**

Sending an email through an SMTP server is a slow, blocking network operation. If we sent emails directly inside the main API flow, every action that triggers an email (registration, purchase, course update) would force the student to wait until the email was fully sent before getting a response. SMTP servers can sometimes take 2-5 seconds. During that time, the Node.js thread is completely blocked.

**What We Did:**

Every single email in the application goes through an email queue (`emailQueue.add('sendEmail', ...)`). We do this in:
- **Registration** — a welcome email is queued after the user account is created.
- **OTP / Password Reset** — the OTP email is queued immediately after the OTP is saved to Redis.
- **After Payment** — a payment receipt email is queued after enrollment is confirmed.
- **Course Published** — when an admin publishes a course, a notification email is queued for every enrolled student via the `course.worker.ts` background job.

In every case, the API responds to the user instantly. The email is delivered in the background by the email worker, completely invisible to the user.

**The Trade-off:**

- **Downside:** Emails may arrive a few seconds after the action is completed, not instantly. If the email worker crashes, emails could be delayed until the worker restarts.
- **Upside:** The main API always responds in under 100 milliseconds, no matter how slow the SMTP server is. BullMQ also has built-in retry mechanisms — if an email fails to send, the worker automatically retries it.

---

## 5. The Login Security Problem: Redis for Brute-Force Protection

**The Problem:**

Any public login endpoint is at risk of brute-force attacks — a bot trying thousands of passwords per second. If we track failed login attempts in MongoDB, each failed attempt requires a database read and write. Under an attack, this floods the database.

**What We Did:**

We track failed login attempts entirely in Redis, not MongoDB. In `auth.service.ts`:

- Every failed login increments a counter in Redis: `login_attempts:{email}` with a 15-minute TTL.
- After 5 failed attempts, we set a lock key in Redis: `login_lock:{email}` for 15 minutes.
- Every login attempt first checks for this lock key in Redis. If it exists, we reject immediately — without ever touching MongoDB.

This means during a brute-force attack, the MongoDB database receives zero extra load. Every rejected request is handled purely from Redis in under 1 millisecond.

**The Trade-off:**

- **Downside:** Redis is an in-memory store. If the Redis server restarts, all lock states are lost and blocked accounts could theoretically log in again immediately (until they are blocked again). This is an acceptable trade-off for development; in production, Redis persistence can be enabled.
- **Upside:** The main database is 100% protected from attack-induced load spikes. The login system is both secure and extremely fast.

---

## 6. The Parallel Query Problem: `Promise.all` Everywhere

**The Problem:**

Many API responses need data from two or more database queries. For example, the course listing needs the courses array AND the total count for pagination. Running them one after the other is wasteful — the total count query has to wait until the courses query finishes, even though they are completely independent.

**What We Did:**

Throughout the codebase, we use `Promise.all` to fire independent queries simultaneously:

```
const [courses, total] = await Promise.all([
  Course.find(filter).skip(skip).limit(limit).lean(),
  Course.countDocuments(filter)
])
```

Both queries run at the exact same time in parallel. The total time taken is the time of the slowest query, not the sum of both. We do this in `listCourses`, `searchCourses`, and `getAllAdmin`.

We also use `.lean()` on all read queries. `.lean()` tells Mongoose to skip creating full Mongoose document objects and return plain JavaScript objects instead. This is significantly faster for read-only operations where we do not need to call `.save()` on the result.

**The Trade-off:**

- **Downside:** Error handling with `Promise.all` is slightly more complex — if one query fails, both fail. We handle this by wrapping calls in try-catch blocks.
- **Upside:** API response times are cut dramatically. A page that previously took 400ms (200ms + 200ms sequential) now takes 200ms (both queries run together).

---

## 7. The Zombie Job Problem: Stale Job Detection in the Video Worker

**The Problem:**

Imagine an admin uploads a video for Lesson A. The transcoding job starts and is sitting in the BullMQ queue. Before it is picked up, the admin realises it was the wrong video and uploads a new one. Now there are **two jobs in the queue** for the same lesson. If both run, the first one (the wrong video) could overwrite the second one (the correct video) after the new video was already saved, corrupting the lesson permanently.

**What We Did:**

Inside `transcode.worker.ts`, before doing any CPU-heavy transcoding work, the worker runs one fast database check:

```
if (!await Lesson.exists({ _id: lessonId, 'video.jobId': String(job.id) })) {
  return { skipped: 'stale-job' }
}
```

When a new video is uploaded, we immediately update the lesson's `video.jobId` in MongoDB to the new job's ID. So when the old (stale) job wakes up and checks `"does this lesson still belong to me?"`, the answer is no — and it exits immediately without processing anything.

We also handle this at upload time in `video.controller.ts` — before queuing a new job, we check if there is an existing queued job and remove it from the queue:

```
const previousJob = await videoQueue.getJob(previousJobId)
if (['waiting', 'delayed', 'prioritized'].includes(previousState)) {
  await previousJob.remove()
}
```

This is a two-layer defence: clean up before queuing, and validate again before processing.

**The Trade-off:**

- **Downside:** This adds one extra database query at the very start of every transcoding job. However, it is an extremely fast `exists()` check — just a boolean lookup on an indexed field.
- **Upside:** We completely prevent a whole class of data corruption bugs. Without this, a race condition between two uploads for the same lesson could destroy the lesson's video permanently, which is the worst possible outcome for a student who has already paid for the course.

---

## 8. The Video Piracy Problem: JWT-Signed Tokens for Every Video Chunk

**The Problem:**

Once a video is processed and stored in cloud storage, the HLS playlist file (`.m3u8`) contains the URLs of every video chunk. A student could share these URLs with 1,000 non-paying people, allowing them to watch the video for free. Worse, a student from Course A could attempt to guess the video path and access videos from Course B that they never paid for.

**What We Did:**

We built a complete secure video delivery system in `video.delivery.ts`. When a student presses "Play":

1. The API generates a short-lived **Video JWT Token** using `createVideoToken()`. This token is signed with a secret key and encodes `userId`, `lessonId`, `courseId`, and `storagePath` into it. It expires quickly (controlled by `VIDEO_TOKEN_EXPIRY_SECONDS`).
2. Every single request for a video playlist or chunk must include this token as a query parameter (`?token=...`).
3. Before serving any content, `buildAuthorizedPlaylist()` verifies the token signature and critically checks:
   - Is the requested path inside the **authorized `storagePath`** from the token? If not — blocked.
   - Does the path end in `.m3u8`? Prevents directory traversal attacks.
4. For the actual video chunks (`.ts` segments), the system generates fresh **pre-signed URLs** from cloud storage, each expiring in seconds (controlled by `VIDEO_SEGMENT_URL_EXPIRY_SECONDS`).

This means a shared URL is worthless within seconds. Each chunk URL is unique, time-limited, and un-shareable.

**The Trade-off:**

- **Downside:** Every single video chunk request now involves a JWT verification and a signed URL generation. This is extra CPU work per request. However, both operations are pure in-memory cryptography — they take under 1 millisecond each and require zero database calls.
- **Upside:** Video content is completely protected. Students cannot share, scrape, or hotlink video content. This directly protects the instructor's content and the business revenue model.

---

## 9. The Abuse Problem: Tiered Rate Limiting Across All Routes

**The Problem:**

Without any protection, a single bad actor (or a buggy frontend) could flood the API with thousands of requests per second. This is called a Denial of Service (DoS) attack. A payment endpoint hit 10,000 times can exhaust the database connection pool and take down the entire system for all other users.

**What We Did:**

We did not just add one global rate limiter. We designed **four different rate limiters** in `middleware/rateLimiter.ts`, each tuned specifically for the sensitivity and expected volume of those routes:

| Route Type | Time Window | Max Requests | Reason |
|---|---|---|---|
| General API (`/api/*`) | 15 minutes | 500 | Normal browsing and reading |
| Auth routes (login, register) | 15 minutes | 10 | Prevent credential stuffing |
| Payment routes | 15 minutes | 20 | Prevent payment fraud loops |
| Video upload routes | 60 minutes | 50 | Prevent storage abuse |

Each limiter responds with a clear JSON error message and uses `standardHeaders: true`, which automatically adds `RateLimit-Remaining` and `Retry-After` headers to every response. This allows the frontend to display a proper countdown to the user instead of a confusing blank error.

**The Trade-off:**

- **Downside:** A legitimate user who is stress-testing the application (like an automated test suite) can accidentally hit these limits. The limits are tuned to be strict enough to block abuse but relaxed enough for normal human usage.
- **Upside:** The most sensitive routes (auth and payment) are protected by an extremely tight limit. If a bot is trying to brute-force OTPs or create fraudulent payment orders, it is stopped at 10 or 20 requests — long before it can cause any real damage to the database or the business.

---

## 10. The Slow Analytics Problem: Batching 12 Aggregations Into One Single Database Trip

**The Problem:**

The admin dashboard shows a lot of data at once — total revenue, student count, course stats, engagement time, revenue trends by day, revenue by category, top 10 courses, lesson completion rates, coupon performance, and student growth over time. A beginner approach would call the database separately for each widget on the dashboard. That means 10–12 sequential database trips just to load a single admin page. Each MongoDB aggregation pipeline can take 100–300ms. Sequentially, that adds up to 2–3 seconds of loading time for every dashboard refresh.

**What We Did:**

Inside `analytics.service.ts`, the entire dashboard is computed in **one `Promise.all` block that fires all 12 aggregation pipelines simultaneously**:

```
const [
  revenueData, studentsData, coursesData, engagementData,
  revenueTrends, revenueByCategory, revenueByCoupon,
  studentGrowth, announcementsCount, topCourses,
  couponStats, lessonAnalytics
] = await Promise.all([...all 12 queries run in parallel...])
```

All 12 queries hit the database at the exact same time. The total time is the time of the single slowest query — not the sum of all 12. This alone reduces dashboard load time from ~3 seconds to under 500 milliseconds.

On top of this, the full dashboard result is cached in Redis for **15 minutes** (`redis.setex(cacheKey, 900, ...)`). Every admin who refreshes the dashboard within those 15 minutes gets an instant answer from Redis memory without touching MongoDB at all.

**The Trade-off:**

- **Downside:** The dashboard data could be up to 15 minutes old. If a student just purchased a course, that revenue won't appear on the dashboard until the cache expires. For an analytics dashboard — which is used for reviewing trends, not monitoring real-time transactions — this is completely acceptable.
- **Upside:** MongoDB is protected from expensive multi-collection aggregation queries firing every time an admin clicks refresh. The 12-pipeline parallel execution combined with Redis caching makes the admin dashboard feel instantaneous.

---

## 11. The Certificate Load Problem: Queued PDF Generation With HTTP 202

**The Problem:**

Generating a PDF certificate is a CPU-intensive operation. It requires reading a font file, drawing text and shapes onto a canvas, embedding a QR code, and rendering the final PDF bytes. If 50 students all complete a course at the same time and hit the "Get Certificate" button simultaneously, running all 50 PDF generations inside the main API server would freeze the entire application for all users.

**What We Did:**

We implemented a two-phase, asynchronous certificate system using BullMQ.

**Phase 1 — The Request (Immediate):**

When a student clicks "Get Certificate", the API in `certificate.controller.ts` does the following:
1. Verifies the student's progress is at least **85%** (a real business rule enforced before any heavy work starts).
2. Checks if a certificate already exists. If yes, returns it instantly.
3. If not, adds a `'generate'` job to the `certificateQueue` and immediately responds with **HTTP 202 Accepted**, not 200 OK.

```
await certificateQueue.add('generate', { userId, courseId })
res.status(202).json({ message: 'Certificate generation started. Check back shortly.' })
```

HTTP 202 is specifically designed to mean: "I have accepted your request, but the work is not done yet." This is the correct and professional way to handle asynchronous operations in REST APIs.

**Phase 2 — The Worker (Background):**

The `certificate.worker.ts` picks up the job, re-validates the progress (a safety double-check), generates the unique `certificateId`, saves the certificate to the database, and queues a congratulatory email to the student — all completely in the background.

**The Trade-off:**

- **Downside:** The student does not get their certificate the instant they click the button. They need to poll or refresh after a few seconds. The API responds with a clear "Check back shortly" message to set this expectation.
- **Upside:** The main API server is completely shielded from CPU-intensive PDF generation. 500 students can all request certificates at the same time, and the main server remains perfectly fast. The worker processes them one by one at its own pace.

---

## 12. The Broadcast & Discount Problem: Delayed Queues, Batched `insertMany`, and Coupon Caching

This section covers two features — Announcements and Coupons — because both share the same underlying engineering philosophy: protect the database and the main server from spikes caused by high-fan-out operations (one action affecting thousands of users at once).

### Part A — Announcements: Scheduled Delivery + Batched `insertMany`

**The Problem:**

An admin sends an announcement to all 5,000 students on the platform. The announcement needs to create an in-app notification for every single student. Creating 5,000 separate `Notification.create()` calls inside the main API is a database disaster — it blocks the thread, hammers MongoDB with 5,000 inserts, and freezes the entire application for all other users.

There is also a second challenge: the admin may want to **schedule** the announcement to be sent at a future time (e.g., "Send this to all students tomorrow at 9 AM").

**What We Did — Scheduling with a Delayed BullMQ Job:**

When an admin creates an announcement with a future `scheduledAt` date, the system calculates the exact milliseconds until that time and passes it as a `delay` to BullMQ:

```
const delay = new Date(announcement.scheduledAt).getTime() - Date.now()
await announcementQueue.add('send-announcement', { announcementId }, { delay })
```

BullMQ holds the job in a "delayed" state in Redis and fires it at exactly the right moment — without any cron job, no `setInterval`, no polling loop. The job wakes up precisely on time, completely automatically.

**What We Did — Batched `insertMany` for Notification Fan-out:**

When the announcement worker runs, instead of inserting notifications one by one, it builds the full array of notification objects in memory first and inserts them in **batches of 1,000 using `insertMany`**:

```
const batchSize = 1000
for (let i = 0; i < notifications.length; i += batchSize) {
  await Notification.insertMany(notifications.slice(i, i + batchSize))
}
```

So for 5,000 students, instead of 5,000 database round-trips, we make exactly **5 database calls**. Each call inserts 1,000 records at once. This is the most efficient way to do large fan-out inserts in MongoDB.

**The Trade-off:**

- **Downside:** Batch inserts bypass Mongoose's `pre('save')` middleware. Any per-document validation logic had to be moved to the application layer before the batch is assembled.
- **Upside:** Sending an announcement to 5,000 students takes 5 database calls instead of 5,000. The main server is never involved. The announcement is delivered precisely on schedule, even if the server restarts between now and the scheduled time — because BullMQ stores the job durably in Redis.

---

### Part B — Coupons: Read-Through Caching to Protect Against Checkout Spikes

**The Problem:**

During a flash sale, hundreds of students might try to apply the same coupon code at the exact same time at the payment checkout page. Every coupon validation checks the database to verify the coupon exists, is active, has not expired, and has not exceeded its usage limit. If 500 students hit the checkout simultaneously, that is 500 concurrent reads on the Coupon collection — all for the exact same document.

**What We Did:**

Inside `coupon.service.ts`, the `validateCoupon` function uses the Redis `getOrSet` cache pattern, with the coupon code as the key:

```
const coupon = await cache.getOrSet(`coupon:${normalizedCode}`, async () => {
  return await Coupon.findOne({ code: normalizedCode }).lean()
}, 300)
```

The first student who applies the coupon triggers a real MongoDB query. The result is cached in Redis for **5 minutes**. Every one of the other 499 students who apply the same coupon during that window reads the answer from Redis memory — MongoDB is queried exactly **once** for all 500 checkout attempts.

When an admin deactivates or updates a coupon, we immediately call `invalidateCache(coupon.code)` which calls `cache.del()` to remove the stale entry, so the next validation gets fresh data.

**The Trade-off:**

- **Downside:** There is a small window (up to 5 minutes) where a coupon that was just deactivated by the admin could still pass validation for cached reads. To mitigate this, any coupon change in the admin panel immediately invalidates the cache entry.
- **Upside:** The coupon validation endpoint can handle thousands of concurrent checkout requests without putting any pressure on the database. This is critical during marketing campaigns and flash sales, which are exactly when the platform experiences its highest concurrent load.
