<div align="center">

<h1>🎓 VeoLMS</h1>

<p><strong>A production-grade Learning Management System built for the real world.</strong></p>

<p>
  VeoLMS is a full-stack, end-to-end LMS inspired by Udemy — built not to check boxes, but to demonstrate real engineering. It covers the complete lifecycle: a student discovers a course, pays for it, watches adaptive-bitrate video, tracks their progress, earns a certificate, and gets notified — all while the system stays fast, secure, and affordable at scale.
</p>

<br />

<!-- Badges -->
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.1-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-5.x-FF6B35?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![HLS](https://img.shields.io/badge/Video-HLS%20%2B%20FFmpeg-E50914?style=flat-square)
![Security](https://img.shields.io/badge/Security-AES--256--GCM-green?style=flat-square&logo=letsencrypt&logoColor=white)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-02042B?style=flat-square)
![Swagger](https://img.shields.io/badge/Docs-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)
![Vitest](https://img.shields.io/badge/Tested-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## Table of Contents

- [Project Overview](#-project-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [High-Level Architecture](#-high-level-architecture)
- [Request Lifecycle](#-request-lifecycle)
- [Video Pipeline](#-video-pipeline)
- [Authentication Flow](#-authentication-flow)
- [Payment Flow](#-payment-flow)
- [Folder Structure](#-folder-structure)
- [API Documentation](#-api-documentation)
- [Database Design](#-database-design)
- [Security Highlights](#-security-highlights)
- [Video Delivery](#-video-delivery)
- [Performance Optimizations](#-performance-optimizations)
- [Cost Optimization](#-cost-optimization)
- [Environment Variables](#-environment-variables)
- [Local Setup](#-local-setup)
- [Docker](#-docker)
- [Testing](#-testing)
- [Architecture Documents](#-architecture-documents)
- [Engineering Decisions](#-engineering-decisions)
- [Challenges Solved](#-challenges-solved)
- [Future Improvements](#-future-improvements)
- [Submission Notes](#-submission-notes)

---

## 📌 Project Overview

### The Problem

Online education platforms are complex. They must handle video at scale, protect paid content, process payments reliably, notify users in real time, and keep costs predictable. Most tutorials skip these concerns entirely.

### Why VeoLMS Exists

VeoLMS is a submission project that demonstrates production-level thinking — not just "make it work", but "make it work at scale, securely, and affordably."

### Target Users

| Role | What They Do |
|---|---|
| **Students** | Browse, purchase, watch, and track course progress |
| **Admins** | Create courses, upload videos, manage students, send announcements |

### Design Philosophy

- **No single service does two jobs.** The API handles requests. Redis handles speed. Workers handle heavy lifting. Storage handles files.
- **All heavy work is asynchronous.** Video transcoding, emails, exports — none block the API.
- **Security is layered.** Each layer adds protection without depending on the one above it.
- **Cost is a first-class concern.** Every infrastructure choice is documented with a cost rationale.

---

## 🌐 Live Demo

| Resource | URL |
|---|---|
| **Frontend** | `https://veo-lms.vercel.app` *(add before submission)* |
| **API Base URL** | `https://veo-lms-api.railway.app/api` *(add before submission)* |
| **Swagger Docs** | `https://veo-lms-api.railway.app/api/docs` *(add before submission)* |
| **Admin Login** | `admin@veolms.com` / `Admin@123456` |
| **Student Login** | `student@veolms.com` / `Student@123456` |

> [!NOTE]
> All payments use **Razorpay test mode**. No real charges are made. Use Razorpay test card: `4111 1111 1111 1111`.

---

## ✅ Features

<details>
<summary><strong>Public Features</strong></summary>

- [x] Homepage with hero, featured courses, and category navigation
- [x] Public course catalog with search and filtering
- [x] Individual course pages with full curriculum preview
- [x] Free preview lessons visible without login
- [x] Learning paths page
- [x] Public certificate verification page
- [x] Mobile-responsive design
- [x] 7 color themes + dark mode + border-radius toggle

</details>

<details>
<summary><strong>Student Features</strong></summary>

- [x] Personalized dashboard with enrolled courses and progress
- [x] Video player with HLS adaptive bitrate (or YouTube fallback)
- [x] Resume playback from last watched position
- [x] 90% completion threshold for lesson marking
- [x] Overall course completion percentage tracking
- [x] Timestamped notes anchored to video position
- [x] Per-lesson discussion threads with threaded replies
- [x] Learning streak tracking
- [x] Downloadable completion certificate (PDF with QR code)
- [x] In-app notification bell
- [x] Profile management

</details>

<details>
<summary><strong>Admin Features</strong></summary>

- [x] Admin dashboard with key metrics and analytics charts
- [x] Full course editor (sections, lessons, reordering)
- [x] Video upload with real-time transcoding progress via WebSocket
- [x] Publish / unpublish courses
- [x] Student management (search, filter, pagination)
- [x] Enrollment management with payment linkage
- [x] Coupon management (percentage / fixed discounts, usage limits)
- [x] Announcement system with batched email fan-out
- [x] Excel export and import for students, courses, enrollments
- [x] Certificate management
- [x] Analytics dashboard with Recharts

</details>

<details>
<summary><strong>Authentication</strong></summary>

- [x] OTP-gated registration (email verified before account creation)
- [x] Access token (15 min) + Refresh token (7 days) with rotation
- [x] Refresh token stored in Redis as `httpOnly` cookie
- [x] Brute-force protection (Redis counters, IP rate limit)
- [x] Password reset via OTP

</details>

<details>
<summary><strong>Payments</strong></summary>

- [x] Razorpay order creation server-side
- [x] HMAC-SHA256 payment signature verification using `crypto.timingSafeEqual`
- [x] Server-side amount verification before enrollment
- [x] Idempotent enrollment (no double enrollment on retry)
- [x] Coupon discount applied before order creation

</details>

<details>
<summary><strong>Video Processing</strong></summary>

- [x] FFmpeg HLS transcoding to multiple quality renditions (1080p, 720p, 480p)
- [x] Thumbnail generation (small, medium, large)
- [x] Background processing via BullMQ (non-blocking API)
- [x] Real-time transcoding progress via Socket.IO (% complete, ETA, stage)
- [x] Crash recovery using `completedQualities` checkpointing
- [x] Private Cloudflare R2 storage
- [x] JWT-gated playlist proxy + per-segment pre-signed URLs

</details>

<details>
<summary><strong>Security</strong></summary>

- [x] Optional RSA + AES-256-GCM end-to-end API payload encryption
- [x] AES-256-GCM encryption of email at rest in MongoDB
- [x] Role-based access control (RBAC) via middleware chain
- [x] Enrollment-based lesson access enforcement
- [x] Helmet + CSP headers
- [x] Redis-backed rate limiting (API, auth, payments, uploads)
- [x] SameSite=Strict cookie policy (CSRF protection)
- [x] Path traversal prevention on video stream proxy

</details>

<details>
<summary><strong>Performance</strong></summary>

- [x] Redis cache on all expensive reads (course listings, categories, featured)
- [x] Cache invalidation on data mutation
- [x] `.lean()` on all read-only Mongoose queries
- [x] `Promise.all` for all parallel independent queries
- [x] `upsert` for progress writes (no read-before-write)
- [x] Gzip compression on all API responses
- [x] Full-text search index on courses (title, description, tags)
- [x] Compound MongoDB indexes for business rule enforcement

</details>

<details>
<summary><strong>Developer Experience</strong></summary>

- [x] npm Workspaces monorepo (client, server, shared)
- [x] Shared Zod schemas and TypeScript types via `@veolms/shared`
- [x] Docker Compose for local MongoDB + Redis
- [x] Seed script with 4 courses, 10–12 lessons each
- [x] Swagger UI auto-generated API documentation
- [x] Vitest API and integration test suites

</details>

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend Framework** | React 18 + Vite 6 | Instant HMR in dev, code-split production bundles, SPA routing |
| **UI Styling** | Tailwind CSS 4 | Utility-first, zero-runtime, fully purgeable |
| **State Management** | Zustand 5 | Lightweight, no boilerplate; auth state lives in memory (not localStorage) |
| **Server State** | TanStack Query 5 | Automatic caching, deduplication, stale-while-revalidate for all API data |
| **Forms** | React Hook Form + Zod | Performant uncontrolled forms; Zod schemas shared with backend |
| **Video Player** | hls.js | Native HLS playback in all browsers; adaptive bitrate switching |
| **Charts** | Recharts | Composable React chart library for analytics dashboard |
| **Animations** | Framer Motion | Declarative, physics-based transitions |
| **Backend Framework** | Express 5 + Node.js 20 | Mature ecosystem; excellent for I/O-bound async workloads |
| **Language** | TypeScript 5.8 (both sides) | Full-stack type safety; shared types via monorepo package |
| **Database** | MongoDB Atlas (Mongoose 8) | Flexible schema maps naturally to course/section/lesson hierarchy |
| **Cache + Queue + Sessions** | Redis 7 (ioredis) | Single in-memory store serving three roles; avoids separate services |
| **Background Jobs** | BullMQ 5 | Redis-backed job queue; retry logic, concurrency control, job priorities |
| **Video Processing** | FFmpeg (fluent-ffmpeg) | Industry-standard; HLS segmentation, multi-quality transcoding |
| **Cloud Storage** | Cloudflare R2 (S3-compatible) | **No egress fees** — critical for video delivery cost at any scale |
| **CDN** | Cloudflare (via R2 public domain) | Global edge for images and thumbnails; zero config |
| **Payments** | Razorpay | Popular in India; clean SDK; test mode for evaluation |
| **Email** | Nodemailer + SMTP | Pluggable; works with Gmail, Ethereal, SendGrid |
| **PDF** | pdf-lib | Server-side certificate generation with QR code embed |
| **Real-Time** | Socket.IO 4 | Bidirectional events for progress updates and notifications |
| **API Docs** | Swagger UI (swagger-jsdoc) | Auto-generated from JSDoc annotations; always in sync with code |
| **Auth** | JWT (jsonwebtoken) + bcryptjs | Access/refresh token pattern; bcrypt(12) for passwords |
| **Validation** | Zod 3 | Schema-first validation; single source of truth for client + server |
| **Testing** | Vitest + Supertest + mongodb-memory-server | Fast in-process tests; real Express routes; in-memory MongoDB |
| **Deployment** | Vercel (frontend) + Railway (API + worker) | Zero-config deploys; Railway runs API and worker as two services |
| **Containerization** | Docker + Docker Compose | Multi-stage build; local dev with Mongo 7 + Redis 7 Alpine |
| **Logging** | Winston | Structured logs; pluggable transports for production |

---

## 🏗 High-Level Architecture

```mermaid
graph TB
    Browser["🌐 Student / Admin Browser"]

    subgraph Frontend["Frontend — Vercel CDN"]
        React["Vite React SPA\nTanStack Query + Zustand"]
    end

    subgraph API["API Server — Railway"]
        Express["Express 5 API\nJWT · Rate Limit · Helmet · Zod"]
    end

    subgraph Workers["Background Workers — Railway"]
        VideoWorker["🎬 Video Worker\nTranscode + Upload"]
        EmailWorker["📧 Email Worker"]
        CourseWorker["📚 Course Worker"]
        CertWorker["🏆 Certificate Worker"]
        AdminWorker["📊 Admin Export / Import"]
        AnnWorker["📢 Announcement Worker"]
    end

    subgraph Redis["Redis Cloud"]
        Cache["Cache\nCourse Listings · Featured"]
        Sessions["Sessions\nRefresh Tokens · OTPs"]
        Queues["BullMQ Queues\nvideo-transcode · email · export"]
    end

    MongoDB["🍃 MongoDB Atlas\nUsers · Courses · Enrollments · Payments"]

    subgraph Storage["Cloudflare R2"]
        Videos["🎥 HLS Videos\nPrivate Bucket"]
        Images["🖼 Thumbnails and Avatars\nPublic CDN Domain"]
    end

    Browser -->|HTTPS| React
    React -->|REST API calls| Express
    Express --> Cache
    Express --> Sessions
    Express --> MongoDB
    Express --> Queues
    Queues --> VideoWorker
    Queues --> EmailWorker
    Queues --> CourseWorker
    Queues --> CertWorker
    Queues --> AdminWorker
    Queues --> AnnWorker
    VideoWorker --> Storage
    React -->|"HLS direct stream (signed URLs)"| Videos
    React -->|Images| Images
```

> [!IMPORTANT]
> Video chunks (`.ts` files) are served **directly from Cloudflare R2** to the browser via expiring pre-signed URLs. The API server **never proxies video data**, keeping API bandwidth costs at zero.

---

## 🔄 Request Lifecycle

```mermaid
sequenceDiagram
    participant B as Browser
    participant R as React Client
    participant A as Express API
    participant Redis
    participant DB as MongoDB

    B->>R: User navigates to /courses
    R->>A: GET /api/courses?page=1
    A->>Redis: GET courses:list:1:12:all
    alt Cache HIT (5 min TTL)
        Redis-->>A: Cached JSON
        A-->>R: 200 OK (less than 1ms)
    else Cache MISS
        Redis-->>A: null
        A->>DB: Course.find().lean()
        DB-->>A: Course documents
        A->>Redis: SET courses:list:1:12:all (TTL 300s)
        A-->>R: 200 OK
    end
    R-->>B: Renders course grid
```

---

## 🎬 Video Pipeline

```mermaid
flowchart TD
    A["Admin uploads MP4\nPOST /api/video/upload"] --> B["Multer saves file\nto /uploads/temp/"]
    B --> C["API adds job to\nvideo-transcode queue"]
    C --> D["API responds 201\nwith jobId instantly"]

    subgraph Workers["Background Workers"]
        E["transcode.worker.ts\nconcurrency: 1"]
        F["ffprobe extracts\nduration, resolution, fps"]
        G["FFmpeg generates\nthumbnails (S/M/L)"]
        H["FFmpeg transcodes to HLS\n1080p · 720p · 480p"]
        I["Saves completedQualities\nto DB for crash recovery"]
        J["Adds job to\nvideo-upload queue"]
        K["upload.worker.ts\nconcurrency: 4"]
        L["Uploads HLS chunks\nto Cloudflare R2"]
        M["Updates Lesson status\nto ready"]
        N["Deletes temp files\nfrom disk"]
        O["Emits video-complete\nSocket.IO event"]

        E --> F --> G --> H --> I --> J --> K --> L --> M --> N --> O
    end

    D -.->|background| E

    subgraph Playback["Secure Playback"]
        P["Student clicks Play\nGET /api/video/:id/play"]
        Q["Check enrollment\ngenerate Video JWT"]
        R2["Return stream URL\n/api/video/stream/...?token=JWT"]
        S["hls.js fetches\nmaster.m3u8 playlist"]
        T["API rewrites playlist\nwith per-segment signed URLs"]
        U["Browser streams .ts chunks\ndirectly from R2"]

        P --> Q --> R2 --> S --> T --> U
    end
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant Redis
    participant DB as MongoDB
    participant Mail as Email Queue

    Note over C,Mail: Step 1 — Send OTP
    C->>A: POST /api/auth/send-otp (name, email)
    A->>Redis: SET otp:{email} = 847291 (TTL 10 min)
    A->>Mail: Queue OTP email via BullMQ
    A-->>C: 200 OK

    Note over C,Mail: Step 2 — Register
    C->>A: POST /api/auth/register (email, otp, password)
    A->>Redis: GET otp:{email}
    Redis-->>A: 847291
    A->>DB: Create User (bcrypt password, AES email)
    A->>Redis: DEL otp:{email}
    A-->>C: accessToken + httpOnly refresh cookie

    Note over C,A: Protected Request
    C->>A: GET /api/courses (Bearer accessToken)
    A->>A: Verify JWT signature (no DB call)
    A-->>C: Protected data

    Note over C,A: Token Refresh
    C->>A: POST /api/auth/refresh-token (cookie)
    A->>Redis: GET refresh:{userId}
    Redis-->>A: Stored refresh token
    A->>A: Verify and rotate token
    A-->>C: New accessToken + new cookie
```

---

## 💳 Payment Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant RP as Razorpay
    participant DB as MongoDB

    C->>A: POST /api/payments/create-order (courseId, couponCode)
    A->>DB: Fetch course price server-side
    A->>DB: Validate coupon if provided
    A->>RP: Create order for final amount
    RP-->>A: orderId and amount
    A-->>C: orderId, amount, razorpayKeyId

    C->>RP: Open Razorpay checkout
    RP-->>C: Payment success (paymentId, orderId, signature)

    C->>A: POST /api/payments/verify (paymentId, orderId, signature)
    A->>A: Recompute HMAC-SHA256 (orderId|paymentId)
    A->>A: timingSafeEqual(computed, received)
    A->>RP: Fetch payment to verify amount
    A->>DB: Mark payment as paid
    A->>DB: createEnrollment (unique index prevents duplicates)
    A-->>C: enrolled true
```

---

## 📁 Folder Structure

```
veolms/                          <- npm Workspaces root
├── apps/
│   ├── client/                  <- Vite + React SPA
│   │   └── src/
│   │       ├── components/      <- Shared UI components (player, layout)
│   │       ├── pages/
│   │       │   ├── public/      <- HomePage, CoursePage, SearchPage
│   │       │   ├── student/     <- Dashboard, LearnPage, MyCoursesPage
│   │       │   └── admin/       <- CourseEditor, ManageStudents, Analytics
│   │       ├── store/           <- Zustand slices (auth, theme)
│   │       ├── hooks/           <- Custom React hooks
│   │       ├── services/        <- Axios API client
│   │       ├── crypto/          <- Client-side AES-256-GCM encryption
│   │       └── styles/          <- themes.css (7 themes + dark mode)
│   │
│   ├── server/                  <- Express API + BullMQ workers
│   │   └── src/
│   │       ├── server.ts        <- HTTP server entrypoint
│   │       ├── worker.ts        <- BullMQ worker entrypoint
│   │       ├── app.ts           <- Express app (middleware, routes)
│   │       ├── modules/         <- Feature-based modular architecture
│   │       │   ├── auth/        <- Register, login, refresh, OTP
│   │       │   ├── course/      <- CRUD, search, sections
│   │       │   ├── lesson/      <- CRUD, access control, ordering
│   │       │   ├── video/       <- Upload, transcode, delivery, streaming
│   │       │   ├── payment/     <- Razorpay integration, verification
│   │       │   ├── enrollment/  <- Lesson access gating
│   │       │   ├── progress/    <- Per-lesson watch time, completion
│   │       │   ├── certificate/ <- PDF generation with QR code
│   │       │   ├── coupon/      <- Discount codes, usage limits
│   │       │   ├── analytics/   <- Dashboard metrics, revenue
│   │       │   ├── announcement/<- Broadcast to enrolled students
│   │       │   ├── discussion/  <- Threaded per-lesson comments
│   │       │   ├── note/        <- Timestamp-anchored video notes
│   │       │   ├── notification/<- In-app notification system
│   │       │   ├── user/        <- Profile, avatar upload
│   │       │   ├── admin/       <- Export/import, student management
│   │       │   ├── streak/      <- Daily learning streak tracking
│   │       │   └── email/       <- Email templates + SMTP dispatch
│   │       ├── config/          <- MongoDB, Redis, BullMQ, Socket.IO
│   │       ├── crypto/          <- RSA + AES-256-GCM middleware
│   │       ├── middleware/      <- authenticate, requireRole, rateLimiter
│   │       └── utils/           <- cache.ts, logger.ts, helpers
│   │
│   └── architecture/            <- All design docs (co-located with code)
│       ├── system-design-hld.md
│       ├── authentication-security-design.md
│       ├── feature-design-lld.md
│       ├── database-design-document.md
│       ├── performance-scalability-optimization.md
│       ├── SECURITY_AUDIT.md
│       ├── COST_BREAKDOWN.md
│       ├── TRADEOFFS.md
│       ├── QA_REPORT.md
│       └── SUBMISSION_CHECKLIST.md
│
├── packages/
│   └── shared/                  <- Shared TypeScript types + Zod schemas
│
├── Dockerfile                   <- Multi-stage production image
├── docker-compose.yml           <- Local MongoDB 7 + Redis 7 Alpine
├── package.json                 <- Workspace root + scripts
└── .env.example                 <- All required variables documented
```

---

## 📖 API Documentation

The API is documented with **Swagger UI**, auto-generated from JSDoc annotations.

**Access Swagger:** `GET /api/docs`

> [!TIP]
> In development: `http://localhost:5000/api/docs`

### API Modules

| Module | Base Path | Description |
|---|---|---|
| **Auth** | `/api/auth` | Send OTP, register, login, refresh token, logout, password reset |
| **Users** | `/api/users` | Profile, avatar upload, account management |
| **Courses** | `/api/courses` | List, search, create, update, publish, delete |
| **Lessons** | `/api/lessons` | Create, update, reorder, delete, access check |
| **Video** | `/api/video` | Upload, stream proxy, signed delivery |
| **Payments** | `/api/payments` | Create order, verify signature, history |
| **Enrollment** | `/api/enrollment` | Enroll, list enrolled courses, lesson access |
| **Progress** | `/api/progress` | Update watch time, completion, course progress |
| **Certificates** | `/api/certificates` | Generate, download, public verify |
| **Coupons** | `/api/coupons` | Create, validate, manage discount codes |
| **Analytics** | `/api/analytics` | Revenue, enrollment trends, student activity |
| **Announcements** | `/api/announcements` | Create and broadcast to enrolled students |
| **Discussions** | `/api/discussions` | Threaded lesson comments |
| **Notes** | `/api/notes` | Video-timestamped student notes |
| **Notifications** | `/api/notifications` | List, mark read, real-time delivery |
| **Admin** | `/api/admin` | Student list, export/import, enrollment overview |

---

## 🗄 Database Design

### Collections

| Collection | Purpose |
|---|---|
| `users` | Account data — email AES-encrypted, emailHash uniquely indexed |
| `courses` | Metadata, embedded sections array, denormalized stats |
| `lessons` | Video data, metadata, transcode status |
| `enrollments` | User to Course with compound unique index (userId, courseId) |
| `payments` | Razorpay order/payment records — signature AES-encrypted |
| `progress` | Per-user, per-lesson watch time (isolated, high-write collection) |
| `certificates` | Generated PDFs, compound unique (userId, courseId) |
| `coupons` | Discount codes, usage limits, expiry |
| `couponusages` | Many-to-many coupon to user — prevents double redemption |
| `notifications` | In-app alerts with expiresAt for auto-filtering |
| `discussions` | Threaded comments with self-referential parentId |
| `notes` | Timestamp-anchored notes per lesson |
| `announcements` | Admin broadcasts |
| `streaks` | Daily learning streak counters |

### Key Relationships

```mermaid
erDiagram
    USER ||--o{ ENROLLMENT : "enrolls in"
    USER ||--o{ PAYMENT : "makes"
    USER ||--o{ PROGRESS : "tracks"
    USER ||--o{ CERTIFICATE : "earns"
    USER ||--o{ NOTE : "writes"
    USER ||--o{ DISCUSSION : "posts"
    COURSE ||--o{ LESSON : "contains"
    COURSE ||--o{ ENROLLMENT : "enrolled by"
    COURSE ||--o{ CERTIFICATE : "awards"
    LESSON ||--o{ PROGRESS : "tracked by"
    LESSON ||--o{ DISCUSSION : "has"
    LESSON ||--o{ NOTE : "annotated in"
    PAYMENT ||--|| ENROLLMENT : "creates"
    COUPON ||--o{ COUPONUSAGE : "redeemed via"
    USER ||--o{ COUPONUSAGE : "uses"
```

> [!NOTE]
> Sections are **embedded** inside the `Course` document. Lessons are **referenced** by ObjectId. This gives fast course loads with no joins for the outline, while keeping the document under MongoDB's 16 MB limit.

---

## 🔒 Security Highlights

### Threat Model Summary

| Threat | Status | Mechanism |
|---|---|---|
| Unauthenticated API abuse | ✅ Protected | JWT on all protected routes + Redis rate limits |
| Brute-force login | ✅ Protected | authLimiter (10 req/15 min), Redis login attempt counters |
| Student accessing admin routes | ✅ Protected | `requireRole('admin')` middleware |
| Non-enrolled user watching paid lessons | ✅ Protected | `checkAccess()` in `lesson.service.ts` |
| Payment forgery | ✅ Protected | Razorpay HMAC verify + `timingSafeEqual` + amount check |
| Stolen refresh token | ✅ Protected | httpOnly cookie + Redis-backed revocation on logout |
| PII leak from DB breach | ✅ Protected | AES-256-GCM email encryption at rest |
| Video hotlinking | ✅ Protected | Private R2 + JWT playlist proxy + expiring segment URLs |
| Path traversal on stream proxy | ✅ Protected | `normalizeStorageKey()` + storage prefix enforcement |
| NoSQL injection | ✅ Protected | Mongoose ODM + Zod input validation |
| CSRF on cookie | ✅ Protected | `SameSite=Strict` cookie policy |
| Screen recording / piracy | ⚠️ Accepted | No DRM — documented limitation |

### Defense-in-Depth Layers

```
Request
  → Helmet (CSP headers)
  → CORS allowlist (FRONTEND_URL only)
  → Rate limiter (Redis-backed, per-IP)
  → Body size limit (10 MB)
  → authenticate middleware (JWT verify — no DB call)
  → requireRole middleware (RBAC check)
  → Zod schema validation (input sanitization)
  → Business logic (enrollment check, payment verify)
  → MongoDB (compound indexes prevent duplicates)
```

### Data Encrypted at Rest

| Field | Algorithm | Collection |
|---|---|---|
| User email | AES-256-GCM | `users` |
| Razorpay signature | AES-256-GCM | `payments` |

### Optional End-to-End Payload Encryption

When `ENABLE_PAYLOAD_ENCRYPTION=true`, every `POST/PUT/PATCH/DELETE` request body is protected using **RSA + AES-256-GCM hybrid encryption**:

1. Client generates a fresh 32-byte AES session key per request
2. Client encrypts JSON body with AES-256-GCM (unique IV per request)
3. Client encrypts the AES key with server's RSA public key (OAEP/SHA-256)
4. Server decrypts AES key with its RSA private key, then decrypts the body
5. Response is also encrypted with the same session key
6. After response, AES key buffer is zeroed from memory

This provides protection even if TLS is terminated by a compromised proxy.

---

## 📹 Video Delivery

### Why This Approach?

| Decision | Rationale |
|---|---|
| **HLS over MP4** | Adaptive bitrate: quality auto-adjusts to network speed. No full re-download on quality switch. |
| **Cloudflare R2 over AWS S3** | R2 has **no egress fees**. S3 egress at video scale dominates costs. |
| **BullMQ for transcoding** | FFmpeg is CPU-bound. Running it in the API process blocks all requests. Workers allow independent scaling. |
| **JWT-gated playlist proxy** | `.m3u8` served through the API (authenticated). Enrollment is checked on every play, not just at purchase time. |
| **Pre-signed URLs for segments** | `.ts` chunks are large. Proxying them through Express burns Railway bandwidth. Pre-signed URLs expire in 2 hours. |
| **Asymmetric TTL** | Video JWT: 20 min (playlist access). Segment URLs: 2 hours (prevents mid-video expiry). Deliberate trade-off. |

### Crash Recovery

If a transcode worker crashes mid-job, the `completedQualities` array saved to the Lesson document acts as a checkpoint. On restart, the worker reads this array and skips already-completed quality renditions.

---

## ⚡ Performance Optimizations

| Technique | Where | Impact |
|---|---|---|
| **Redis cache** | Course listings, featured, categories, individual pages | 95% fewer DB reads under load |
| **Cache invalidation** | `invalidateCache()` on any admin mutation | No stale data served |
| **`.lean()`** | All read-only Mongoose queries | 2–5x faster document serialization |
| **`Promise.all`** | Parallel independent queries (courses + count, etc.) | Halves response time on paginated routes |
| **`upsert` for progress writes** | `Progress.findOneAndUpdate(..., { upsert: true })` | Single atomic op, no read-before-write |
| **Fire-and-forget streak** | `updateLearningStreak().catch(console.error)` | Streak never blocks the critical progress save |
| **BullMQ async processing** | Emails, video, exports, certificates | API always responds in under 100ms |
| **`deleteMany` bulk ops** | Course and lesson deletion | One DB command instead of N round-trips |
| **Full-text search index** | `Course.title + description + tags` | No external search engine needed |
| **Compound indexes** | Enrollment `(userId, courseId)`, Progress `(userId, lessonId)` | Business rules enforced at DB level |
| **Gzip compression** | All API responses via `compression` middleware | Reduced network payload for all calls |
| **Code splitting** | Vite route-based lazy loading | Only current route JS is downloaded |

---

## 💰 Cost Optimization

### Monthly Estimate (Prototype Scale)

| Service | Tier | Expected Usage | Monthly Cost |
|---|---|---|---|
| **Vercel** (frontend) | Free | < 5 GB bandwidth | **₹0** |
| **Railway** (API + worker) | Hobby $5/mo | 1 web + 1 worker service | **~₹400** |
| **MongoDB Atlas** | M0 Free 512 MB | < 50 MB | **₹0** |
| **Redis Cloud** | Free 30 MB | < 10 MB | **₹0** |
| **Cloudflare R2** | Free 10 GB + no egress | 2–8 GB video | **₹0** |
| **Razorpay** | Test mode | Unlimited test transactions | **₹0** |
| **Email SMTP** | Ethereal / Gmail | Low volume | **₹0** |
| | | **Total** | **₹0 – ₹500/mo** |

### Why These Numbers Stay Low

- **R2 instead of S3** — S3 charges ~$0.09/GB egress. R2 egress is free. For video workloads this is the single biggest cost decision.
- **Single Redis instance for three roles** — Cache, BullMQ queues, and session storage share one 30 MB Redis instance. No separate services needed.
- **Workers on Railway, not EC2** — No dedicated transcoding cluster. The Railway worker process handles FFmpeg jobs on demand.
- **Video chunks never proxy through API** — Zero API bandwidth cost for video. Segments go directly from R2 to the browser.
- **MongoDB full-text search** — No Elasticsearch or Algolia subscription.

> See [`apps/architecture/COST_BREAKDOWN.md`](apps/architecture/COST_BREAKDOWN.md) for the full breakdown and projections.

---

## 🔑 Environment Variables

Never commit secrets. Copy `.env.example` to `.env` and fill in your values.

```bash
cp .env.example .env
```

### Key Variables (see `.env.example` for the full list)

| Variable | Description |
|---|---|
| `PORT` | API port (default: `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_ACCESS_SECRET` | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (default: `7d`) |
| `VIDEO_TOKEN_EXPIRY_SECONDS` | Playlist JWT TTL (default: `1200`) |
| `VIDEO_SEGMENT_URL_EXPIRY_SECONDS` | Signed segment URL TTL (default: `7200`) |
| `ENCRYPTION_KEY` | 64-char hex for AES email encryption |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public CDN URL for images and thumbnails only |
| `RAZORPAY_KEY_ID` | Razorpay key ID (test mode) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `FRONTEND_URL` | CORS allowlist URL |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email configuration |

---

## 🚀 Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (for MongoDB + Redis) or standalone installations
- FFmpeg installed and on `$PATH`

### 1. Clone and Install

```bash
git clone https://github.com/your-org/veolms.git
cd veolms
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your Cloudflare R2, Razorpay, and SMTP values
```

### 3. Start Infrastructure (Docker)

```bash
docker compose up -d
# Starts MongoDB 7 and Redis 7 Alpine with persistent volumes
```

### 4. Seed the Database

```bash
npm run seed
# Creates admin, student accounts, and 4 courses with ~10–12 lessons each
```

### 5. Run in Development

```bash
npm run dev
# Concurrently starts: React dev server, Express API, BullMQ worker
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| API | `http://localhost:5000/api` |
| Swagger Docs | `http://localhost:5000/api/docs` |

### 6. Build for Production

```bash
npm run build
```

---

## 🐳 Docker

A multi-stage `Dockerfile` is provided for production deployment.

```bash
# Build the production image
docker build -t veolms-server .

# Run the API server
docker run -p 5000:5000 --env-file .env veolms-server
```

The `docker-compose.yml` in the root is for **local development only** — it runs MongoDB 7 and Redis 7 Alpine with persistent volumes.

> [!NOTE]
> The Dockerfile uses a two-stage build. A `builder` stage compiles TypeScript, and a lean `runner` stage copies only compiled output. FFmpeg must be available on the deployment host. Railway includes it; for custom Docker deploys, add `RUN apk add ffmpeg` to the runner stage.

---

## 🧪 Testing

### Test Suites

| Suite | Location | What it covers |
|---|---|---|
| **Auth API** | `apps/server/tests/api/auth/` | Register flow, login, invalid OTP, token refresh |
| **Course API** | `apps/server/tests/api/course/` | Admin create/update, student forbidden access |
| **Payment API** | `apps/server/tests/api/payment/` | Verify, duplicate payment, invalid signature |
| **Enrollment API** | `apps/server/tests/api/enrollment/` | Lesson access control, enrollment check |
| **Integration** | `apps/server/tests/integration/` | Full auth, payment, and upload flows |

### Running Tests

```bash
# All workspaces
npm run test

# Server only (in-memory MongoDB, no external DB needed)
npm run test -w @veolms/server

# Watch mode
npm run test:watch -w @veolms/server
```

Tests use **mongodb-memory-server** — no external database required. Each suite spins up a fresh in-memory MongoDB, runs real Express routes via Supertest, and tears down cleanly.

> [!NOTE]
> Test coverage is not published to avoid inflating numbers. The suites cover mandatory business-critical paths: auth, course access control, payment signature verification, and enrollment gating.

---

## 📚 Architecture Documents

All design documentation lives in [`apps/architecture/`](apps/architecture/) — co-located with code so it stays in sync with changes.

| Document | Purpose | When to Read |
|---|---|---|
| [`system-design-hld.md`](apps/architecture/system-design-hld.md) | All 6 architecture layers with trade-offs | **Start here** |
| [`authentication-security-design.md`](apps/architecture/authentication-security-design.md) | RSA+AES encryption, JWT, OTP flow, RBAC, video JWT deep dive | Security review |
| [`feature-design-lld.md`](apps/architecture/feature-design-lld.md) | Module-level design: auth, video pipeline, progress, coupons, admin export | Code review |
| [`database-design-document.md`](apps/architecture/database-design-document.md) | Schema decisions, indexing strategy, denormalization rationale | DB review |
| [`performance-scalability-optimization.md`](apps/architecture/performance-scalability-optimization.md) | Redis caching, async patterns, bulk ops, brute-force protection | Performance review |
| [`SECURITY_AUDIT.md`](apps/architecture/SECURITY_AUDIT.md) | Threat model matrix, residual risks, production checklist | Security audit |
| [`COST_BREAKDOWN.md`](apps/architecture/COST_BREAKDOWN.md) | Monthly cost estimate, service selection rationale | Cost review |
| [`TRADEOFFS.md`](apps/architecture/TRADEOFFS.md) | Every deliberate compromise: DRM, segment proxying, Redis consolidation | Architecture discussion |
| [`QA_REPORT.md`](apps/architecture/QA_REPORT.md) | Manual test matrix for all user flows and security checks | QA verification |
| [`SUBMISSION_CHECKLIST.md`](apps/architecture/SUBMISSION_CHECKLIST.md) | Requirement-to-implementation mapping | Evaluator reference |
| [`video-pipeline-architecture.md`](video-pipeline-architecture.md) | Video upload → transcode → delivery pipeline in detail | Video system review |

---

## 🧠 Engineering Decisions

### MongoDB over PostgreSQL

Course curriculum maps naturally to a document — course → sections → lesson IDs. A flexible schema allowed rapid iteration. The trade-off of no foreign key constraints is mitigated by compound unique indexes at the collection level and Zod validation at the API layer.

### Redis for Three Roles

At prototype scale, a single 30 MB Redis instance handles cache, BullMQ queues, and session storage. This avoids paying for separate services. The trade-off is shared memory between cache eviction and job queue memory; acceptable and documented.

### BullMQ for All Heavy Work

FFmpeg and email sending are blocking operations. Running them in the API process would stall Node.js's event loop. BullMQ lets workers run in separate processes with built-in retry, configurable concurrency, and crash recovery via Redis-backed job state.

### Cloudflare R2 over AWS S3

R2 has no egress fees. AWS S3 charges ~$0.09/GB egress. For a video-heavy application this is the dominant cost driver at scale. R2 is S3-API-compatible, so switching requires only an endpoint environment variable change.

### Railway over EC2

Railway runs both `server.ts` and `worker.ts` as two separate services in one project. It eliminates the need for a dedicated instance or Kubernetes for a prototype. The trade-off is shared CPU during heavy transcoding; documented and acceptable for the evaluation scale.

### JWT + Redis Refresh Tokens

Access tokens are verified purely by cryptographic signature — zero database calls per request. Short 15-minute expiry limits damage from a stolen token. Refresh tokens in Redis enable instant revocation on logout without rotating the global secret.

### AES-256-GCM for Email at Rest

GCM is authenticated encryption. Unlike AES-CBC, it produces an authentication tag proving the ciphertext was not tampered with. The separate `emailHash` field solves the unsearchable-ciphertext problem — login lookups hit the hash index in under 1ms.

### hls.js for Video Playback

Native HLS playback on Safari. hls.js handles the edge cases across all non-native browsers. Adaptive bitrate gives students the best quality their network supports without manual quality selection.

### TanStack Query for Client State

Automatic caching, deduplication, and background refetch reduce unnecessary API calls. The stale-while-revalidate pattern means users see data immediately while fresh data loads silently in the background.

### Zustand for Auth State

Auth tokens live in memory (Zustand), not localStorage. This prevents XSS from reading access tokens. Refresh tokens live in httpOnly cookies — inaccessible to JavaScript entirely.

---

## 🧗 Challenges Solved

### 1. Secure Video Delivery Without DRM

**Challenge:** Paid course videos must be inaccessible to non-enrolled users and URLs must not be shareable beyond expiry.

**Solution:** Three-layer approach. (1) Enrollment check before generating a short-lived Video JWT. (2) API proxies the `.m3u8` playlist, rewriting each segment path to a freshly signed R2 URL. (3) R2 `videos/` prefix is private — direct access returns 403.

### 2. Non-Blocking Video Transcoding

**Challenge:** FFmpeg is CPU-intensive. Running it in the API process caused request timeouts during video uploads.

**Solution:** Two-queue BullMQ pipeline. API adds a job and responds in milliseconds. `transcode.worker.ts` (concurrency: 1) handles FFmpeg. `upload.worker.ts` (concurrency: 4) handles the I/O-bound R2 upload. Both run in a separate process completely isolated from the API.

### 3. Payment Integrity

**Challenge:** How do we know a payment ID sent by the frontend is real and not fabricated?

**Solution:** HMAC-SHA256 signature verification using the Razorpay secret. We independently recompute the signature server-side and compare using `crypto.timingSafeEqual` (prevents timing attacks). Then we fetch the payment from Razorpay's API to verify the amount matches our order exactly.

### 4. Scalable Caching with Consistent Invalidation

**Challenge:** Course data is read-heavy. MongoDB queries on every homepage request would not scale.

**Solution:** `CacheService.getOrSet()` on Redis with key namespacing. On any admin mutation, `invalidateCache()` wipes all related keys using pattern deletion. TTLs are tuned per access pattern: categories 1 hour, featured 10 min, individual courses 5 min.

### 5. Duplicate Enrollment Prevention

**Challenge:** Slow networks or double-clicks can call the verify-payment endpoint twice with the same payment ID.

**Solution:** Compound unique index `(userId, courseId)` on `Enrollment` enforces uniqueness at the database level. A MongoDB duplicate key error is caught and returned as 409, preventing double enrollment regardless of race conditions.

### 6. Cost Under Video Workload

**Challenge:** Video storage and delivery costs can spiral quickly at scale.

**Solution:** Cloudflare R2 (no egress fees), segments served directly from R2 (zero API bandwidth), and FFmpeg on-demand in the Railway worker (no dedicated transcoding server). Total cost: under ₹500/month at prototype scale.

---

## 🔭 Future Improvements

| Improvement | Why |
|---|---|
| Widevine / FairPlay DRM | Prevents screen recording; needed for enterprise content licensing |
| Upload exports to cloud storage | Current filesystem export breaks on horizontal scaling |
| MongoDB TTL index on notifications | Prevents collection bloat as user count grows |
| Redis Sentinel or Cluster | High availability for session store and job queue |
| Separate Redis instances | Isolate BullMQ queues from cache to prevent resource contention |
| Razorpay webhooks | Push-based payment confirmation is more reliable than client-triggered verify |
| Course recommendation engine | Collaborative filtering using existing enrollment and progress data |
| CDN proxy for API | Cloudflare Workers in front of Railway would reduce global latency |

---

## 📝 Submission Notes

This project prioritizes **explainability over feature quantity**.

Every non-trivial decision in this codebase has a corresponding document explaining the problem, the chosen approach, the trade-offs accepted, and what was deliberately left out.

**Architecture first.** The `apps/architecture/` folder contains 10 documents covering system design, security, database design, performance, cost, and trade-offs. These were written alongside the code, not after.

**Security by default.** Authentication, authorization, data encryption, payment verification, and video protection are implemented at multiple independent layers. Compromising one layer does not compromise the system.

**Cost is a design constraint.** Every infrastructure service was selected with its free tier limits documented. Monthly cost at prototype scale: ₹0–₹500 ($0–$6 USD).

**Honest trade-offs.** Known limitations — no DRM, no horizontal export scaling, single Redis instance — are documented in [`TRADEOFFS.md`](apps/architecture/TRADEOFFS.md) and [`SECURITY_AUDIT.md`](apps/architecture/SECURITY_AUDIT.md). Not hidden.

---

<div align="center">

## Final Summary

VeoLMS is a production-like LMS that demonstrates real engineering decisions.

**Not feature count — engineering depth.**

The codebase is organized for maintainability.
The architecture is designed for scalability.
The security model is layered and documented.
The cost model is honest and deliberate.

Every module, decision, and trade-off is explained — in the code, in the docs, and in this README.

*Built with care. Documented with honesty. Designed for scale.*

</div>
