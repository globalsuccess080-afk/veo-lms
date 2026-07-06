# veoLMS Low Level Design: Feature-by-Feature Engineering Decisions

This document goes deep into the specific engineering decisions made inside each feature of veoLMS. While the High Level Design explains the overall architecture, this document explains exactly how each module was designed, what data it owns, and what makes each implementation precise and robust.

---

## 1. Authentication Flow (Registration + Login + Refresh)

**Registration is a 3-phase atomic flow:**

1. `POST /api/auth/send-otp` — Generates a 6-digit OTP, stores it in Redis as `otp:{email}` with a 10-minute TTL, and queues a verification email via BullMQ. Returns immediately.
2. `POST /api/auth/register` — Reads `otp:{email}` from Redis, validates it, creates the User (password bcrypt-hashed with 12 salt rounds), deletes the OTP key, and queues a welcome email. Returns access + refresh tokens.
3. Refresh tokens are stored in Redis as `refresh:{userId}` with a 7-day TTL. On every token refresh, the old refresh token is replaced with a new one (token rotation), invalidating any stolen old tokens.

**Trade-off:** Bcrypt with 12 rounds is intentionally slow (~200ms per hash). This is the correct choice for passwords — it makes brute-forcing computationally infeasible — but it means login always takes at least 200ms regardless of server load.

---

## 2. Course & Lesson Management

**The section-lesson relationship is managed at two levels simultaneously:**

- The `Course` document stores sections as an embedded subdocument array. Each section contains a `lessons` array of ObjectIds (references to the `Lesson` collection).
- When a lesson is created, it is saved to the `Lesson` collection AND its `_id` is pushed into the parent section's `lessons` array inside the `Course` document. Both happen in the same request.
- When a lesson is deleted, the `_id` is removed from the section's `lessons` array with `section.lessons.filter(...)`, the `Lesson` document is deleted, and `recalcStats()` is called to recompute `totalLessons` and `totalDuration` on the Course.

**Stale Duration Guard in `updateLesson`:**

There is a subtle but critical guard: if an admin has the lesson edit form open while a video is being transcoded, the form might submit a `duration: 0` after transcoding finishes (because the form loaded before transcoding completed). The service reads the actual `video.metadata.duration` from the database and uses it if it is a valid positive number, ignoring the stale `0` from the form submission. This prevents video durations from being accidentally wiped.

**Trade-off:** This means a single lesson update request now performs two database reads (one to check metadata, one to update). However, the correctness guarantee for lesson durations is worth the extra read.

---

## 3. Video Processing Pipeline (Transcode → Upload → Ready)

The video pipeline is split into two separate BullMQ queues and workers deliberately:

**Queue 1: `video-transcode` (concurrency: 1)**
- Downloads the raw uploaded video from temp storage.
- Extracts metadata (duration, resolution, fps, codec, bitrate) using FFmpeg.
- Generates 3 video thumbnails (small, medium, large) at different timestamps.
- Transcodes the video into HLS format for each quality level (1080p, 720p, 480p).
- As each quality finishes transcoding, it immediately starts uploading that quality to cloud storage in the background (not awaited). This is the "pipeline" pattern — transcoding and uploading run in parallel.
- Saves `completedQualities` to the database after each quality, enabling crash recovery.

**Queue 2: `video-upload` (concurrency: 4)**
- Handles the final upload of all HLS chunks and master playlist.
- After upload, calls `recalcStats()` to update the course's total duration.
- Emits a `Socket.IO` event (`emitVideoComplete`) so the admin's browser updates in real-time without polling.

**Crash Recovery:** If the transcode worker crashes mid-job, the `completedQualities` array saved in the Lesson document tells it exactly which quality levels were already done. On restart, it skips those and resumes from where it left off.

**Trade-off:** Having two separate queues means two separate Redis connections and two worker processes. However, it allows the upload concurrency (4) to be tuned independently from transcoding concurrency (1). Transcoding is CPU-bound and should be single-threaded per machine. Uploading is I/O-bound and can be highly concurrent.

---

## 4. Real-Time Video Progress (Socket.IO)

**The Problem:** The admin needs to see live transcoding progress (% complete, current stage, ETA) without polling the API every second.

**What We Did:** The transcode worker emits WebSocket events via `emitVideoProgress()` for every 1% of progress. These events carry:
- `lessonId` — so the frontend knows which lesson's status to update
- `percent` — current progress (0–100)
- `stage` — current pipeline stage (ANALYZING, TRANSCODING, UPLOADING_STORAGE, FINALIZING, READY, FAILED)
- `completedQualities` — list of quality levels done so far
- `etaSeconds` — estimated seconds remaining (calculated from elapsed time vs. progress)

Database writes for progress are throttled to at most once every 3 seconds to prevent excessive write load during long transcodes (a 2-hour video at 1% updates = ~200 DB writes without throttling).

**Trade-off:** WebSocket events are fire-and-forget. If the admin closes and reopens the browser, the current progress state is read from the database (which is updated every 3 seconds), not from the WebSocket history. This means the UI could show up to 3 seconds of stale progress on reconnect, which is imperceptible in practice.

---

## 5. Progress Tracking & Lesson Completion Logic

The `updateProgress` function in `progress.service.ts` enforces a critical business rule: **completion is sticky**.

```
const completed =
  alreadyCompleted         // was already completed before? keep it
  || isCompleted === true  // explicitly marked complete by frontend?
  || (safeTotal > 0 && watchedSeconds / safeTotal >= 0.9)  // watched 90%+?
```

Once a lesson is marked complete, it never reverts to incomplete, even if the student replays it from the beginning. This prevents gaming the completion percentage by replaying lessons after being marked complete.

When a lesson is completed, the system recalculates the overall course completion percentage using two counts:
- `Lesson.countDocuments({ courseId })` — total lessons
- `Progress.countDocuments({ userId, courseId, isCompleted: true })` — completed lessons

This percentage is written to `Enrollment.progress`, which is the authoritative course progress value displayed on the dashboard.

**Trade-off:** This recalculation fires on every single lesson completion event, adding two database count queries. An alternative would be to maintain a counter on the Enrollment document and increment it. However, that counter could drift if lessons are added or deleted from the course after enrollment. Recalculating from source of truth is slower but always accurate.

---

## 6. Discussion (Threaded Comments Per Lesson)

The Discussion model uses a `parentId` field (self-referential) to support threaded comments:
- A top-level comment has `parentId: null`.
- A reply has `parentId` set to the parent comment's `_id`.

The index `{ lessonId: 1, createdAt: -1 }` ensures that fetching all comments for a lesson is fast and pre-sorted by newest first.

When a parent comment is deleted, all direct replies are also deleted using `deleteMany`:
```
await Discussion.deleteMany({ parentId: messageId })
```

**Access control** is enforced in the service: only the original author (matched by `userId`) or an admin can delete a message. This check is done in the service layer, not just the middleware layer, providing defence-in-depth.

**Trade-off:** We only do one level of cascade delete (replies to the deleted message). If replies have their own replies, those deeper replies become orphaned. For an LMS discussion board where deep nesting is uncommon, this is an acceptable simplification that avoids a recursive database traversal.

---

## 7. Notes (Timestamp-Anchored Per Lesson)

The `Note` model stores a `timestamp: Number` field (in seconds). This links each note to a specific moment in the video. When a student clicks "Add Note" at the 4-minute mark, the video player's current position (240 seconds) is saved with the note.

The index `{ userId: 1, lessonId: 1, timestamp: 1 }` allows notes to be fetched and pre-sorted by video position, so the notes panel always shows them in the order they appear in the video, not in the order they were written.

**Trade-off:** Notes are stored per lesson, not per video timestamp range. This means if the video is replaced (re-uploaded), old notes still reference the same timestamps in the new video. There is no mechanism to detect that a specific timestamp is now invalid. For an LMS, this edge case is rare and acceptable.

---

## 8. Notifications (Multi-Channel, Priority-Aware)

The Notification model is the central hub for all in-app alerts. It is designed to support multiple triggering sources:

| Trigger | Type | Example |
|---|---|---|
| Payment success | `enrollment` | "You are now enrolled in React Masterclass" |
| Learning milestone | `system` | "🎉 7-day learning streak!" |
| Announcement | `announcement` | Links back to the `Announcement` document |
| Course update | `course_update` | "React Masterclass has been updated" |

The `expiresAt` field allows time-limited notifications. The notification query always filters out expired ones: `$or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }]`. This means promotional or time-sensitive notifications automatically stop appearing after their expiry without needing a cleanup job.

The `markAllRead` function uses `updateMany` to mark all unread notifications in a single database command, not a loop.

**Trade-off:** Notifications are never automatically deleted. They accumulate over time per user. In a high-traffic system, this collection could grow very large. An archival/TTL strategy should be implemented as the user base grows (e.g., auto-delete notifications older than 90 days using a MongoDB TTL index on `createdAt`).

---

## 9. Admin Data Export & Import (Queued XLSX)

Exporting large datasets (thousands of students, courses, enrollments) to Excel is a slow, memory-intensive operation. Doing it in a synchronous API call would freeze the server.

**Export Flow:**
1. Admin hits `/api/admin/export/students`.
2. The API adds an `'export'` job to `adminExportQueue` and returns `{ jobId }` immediately.
3. The admin can poll `/api/admin/jobs/{jobId}` to check if the export is done.
4. The worker reads data from MongoDB, uses the `xlsx` library to build the workbook, and saves the file to the server's `storage/` directory.

**Import Flow:**
1. Admin uploads a `.xlsx` file via multipart form.
2. The file is saved to `uploads/temp/` by Multer.
3. An import job is added to `adminImportQueue` with the file path.
4. The worker reads the Excel file, validates each row, and creates records in bulk.

**Trade-off:** The exported file is saved to the local server filesystem (`storage/` directory). This works fine for a single-server deployment but would break in a horizontally scaled environment where multiple API servers run on different machines (the file would be on one server but the download request might hit another). For production scale, the export file should be uploaded to cloud storage and a pre-signed download URL returned to the admin.
