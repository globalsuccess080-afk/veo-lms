# VeoLMS Video Delivery Pipeline Architecture

This document provides a comprehensive architectural overview of the video upload, processing, storage, and secure delivery pipeline within the VeoLMS application.

## 1. High-Level Architecture Overview

The video delivery pipeline is designed to be highly scalable, asynchronous, and secure. It utilizes **BullMQ** for robust background job processing (transcoding and uploading), **FFmpeg** for adaptive bitrate HLS generation, and **Signed URLs + JWTs** to secure video playback.

The pipeline is split into three main phases:
1. **Upload & Queueing**: Synchronous API accepting the file and queueing the job.
2. **Asynchronous Processing**: Background workers handling heavy video transcoding and storage uploading.
3. **Secure Delivery (Playback)**: Just-in-time generation of signed playlist segments authorized via short-lived JWTs.

---

## 2. Phase 1: Upload & Queueing

**Key Files:** `video.controller.ts`, `video.router.ts`, `bullmq.ts`
**Endpoint:** `POST /api/video/upload`

1. **API Request**: An admin uploads a raw video file associated with a specific `lessonId`.
2. **Validation**: The `upload` controller validates the presence of the file and the corresponding lesson.
3. **Cleanup of Prior Jobs**: If the lesson already had a pending video job in progress, the controller attempts to cancel it.
4. **Database Initialization**: The lesson's video status is updated to `queued`, a new `jobId` is generated, and the status message is set to wait for a transcoder.
5. **Queueing**: A `transcode` job is added to the **`video-transcode`** BullMQ queue. The raw video file temporarily resides on the server's disk (usually handled by `multer`).
6. **Response**: The API immediately responds with `201 Created` and the `jobId` without waiting for the video processing to finish.

---

## 3. Phase 2: Asynchronous Processing (Workers)

To prevent the API server from blocking, heavy processing is offloaded to background workers initiated in `worker.ts`. This phase is divided into two separate worker flows.

### Step A: Transcoding (`transcode.worker.ts`)
**Queue**: `video-transcode`

1. **Initialization**: The worker picks up the raw video file and initializes a `ProgressService` to emit progress updates (via WebSocket and DB).
2. **Metadata Extraction**: `MetadataService` invokes `ffprobe` to determine video duration, resolution, and format.
3. **Thumbnail Generation**: `ThumbnailService` generates small, medium, and large thumbnails at specific timestamps.
4. **Adaptive HLS Transcoding**: 
   - `TranscodeService` executes `ffmpeg` to generate **HTTP Live Streaming (HLS)** assets.
   - It iterates over predefined `QUALITY_PRESETS` (e.g., 1080p, 720p, 480p, 360p) to create different bitrate streams.
   - It segments the video into small `.ts` files (e.g., 4-6 second chunks) and generates variant `.m3u8` playlists.
   - It compiles a `master.m3u8` playlist linking all variant streams.
5. **Handoff**: Once all local transcoding is complete, the worker queues an `upload` job with all the file paths and metadata into the `videoUploadQueue`. It does **not** upload to cloud storage directly to separate concerns and handle failures independently.

### Step B: Storage Upload (`upload.worker.ts`)
**Queue**: `video-upload`

1. **Storage Transfer**: The worker uses `StorageService` (typically configured for AWS S3 or Cloudflare R2) to bulk upload the generated HLS directory and thumbnails to the remote bucket.
2. **Database Finalization**: Upon successful upload, it updates the `Lesson` document:
   - Sets the `masterPlaylistKey`.
   - Populates metadata and thumbnail paths.
   - Marks the status as `ready`.
3. **Cleanup**: Both the raw uploaded video and the locally transcoded HLS chunks are permanently deleted from the worker's disk (`CleanupService`).
4. **Event Emission**: Triggers a `recalcStats` for the course and emits a `video-complete` WebSocket event so the client UI can reflect the finished state.

---

## 4. Phase 3: Secure Delivery & Playback

To prevent unauthorized downloading or hotlinking of paid course content, VeoLMS employs a dynamic proxy mechanism for HLS playlists.

**Key Files:** `video.controller.ts`, `video.delivery.ts`, `lesson.service.ts`

1. **Requesting Playback (`GET /api/video/:lessonId/play`)**:
   - The user requests to play a video.
   - The system checks if the user is enrolled and authorized (`getVideoUrl`).
   - If authorized, it generates a short-lived **JWT Video Token** (`createVideoToken`) containing the `lessonId` and allowed `storagePath`.
   - It returns the stream URL: `/api/video/stream/{path}?token={jwt}`.

2. **Playlist Proxying (`GET /api/video/stream/*path`)**:
   - The client's video player requests the HLS playlist using the provided URL and token.
   - The `playlist` controller passes the path and token to `buildAuthorizedPlaylist` in `video.delivery.ts`.
   
3. **Dynamic Playlist Generation (`video.delivery.ts`)**:
   - **Verification**: The JWT token is validated. The system verifies that the requested `*path` falls inside the token's authorized `storagePath` prefix.
   - **Fetching**: The raw `.m3u8` file is fetched from remote storage (and cached in memory to reduce I/O).
   - **Parsing & Rewriting**: 
     - If the file is the **master playlist**, it appends the `?token=...` parameter to all internal variant stream URLs, ensuring the token propagates.
     - If the file is a **variant playlist**, it iterates through every `.ts` segment entry. Instead of returning raw paths, it dynamically calls `storageService.getSignedUrl(key)` to generate an expiring, secure URL (e.g., AWS presigned URL) for each individual video chunk.
   - **Delivery**: The modified `.m3u8` text is served to the client with `application/vnd.apple.mpegurl` headers and strict no-cache headers.

### Security Benefits
- **No Direct Access**: The storage bucket remains completely private.
- **Expiring Links**: Each `.ts` video chunk gets a unique signed URL that expires shortly after it is generated.
- **Anti-Hotlinking**: Even if a user copies a segment URL, it will expire within minutes (e.g., `VIDEO_SEGMENT_URL_EXPIRY_SECONDS`), preventing long-term sharing or scraping of the course content.
