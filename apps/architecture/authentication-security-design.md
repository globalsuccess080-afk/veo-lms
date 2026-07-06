# veoLMS Authentication & Security Architecture

Security is not an afterthought in veoLMS — it is built into every layer of the system. This document explains how we handle authentication, protect sensitive data, prevent abuse, and secure video content delivery. Every decision here is a deliberate trade-off between security and usability.

---

## 1. End-to-End API Payload Encryption (RSA + AES-256-GCM Hybrid)

**The Problem:**

Even with HTTPS, data inside an API request is encrypted only at the transport layer (TLS). If TLS is ever terminated by a proxy, a misconfigured load balancer, or a man-in-the-middle attack, the raw JSON payload (containing passwords, OTPs, personal details) is exposed in plaintext. This is called a "TLS stripping" attack, and it is a real threat in enterprise environments.

**What We Did:**

We implemented a full **Hybrid Encryption System** applied as a global Express middleware (`src/crypto/encryption.middleware.ts`). This system uses two algorithms working together:

- **RSA (asymmetric)** — to securely share a session key
- **AES-256-GCM (symmetric)** — to encrypt the actual request and response payloads

**How it works, step by step:**

**On the Frontend (before every sensitive API call):**
1. The client generates a fresh, random **32-byte AES session key** just for this one request.
2. The client encrypts the JSON request body using **AES-256-GCM**, producing:
   - `data` — the encrypted ciphertext (base64)
   - `iv` — a random 12-byte Initialization Vector (base64). This is never reused.
   - `tag` — the GCM Authentication Tag (base64), which proves the data was not tampered with.
3. The client encrypts the AES session key itself using the **server's RSA Public Key** (RSA-OAEP with SHA-256 padding). Only the server's private key can decrypt this.
4. The request is sent as `{ encryptedKey, data, iv, tag }`.

**On the Backend (the `globalEncryptionMiddleware`):**
1. The middleware reads `encryptedKey` and **decrypts the AES session key** using the server's **RSA Private Key** (stored only in the environment, never exposed). The RSA key uses OAEP padding with SHA-256 — the most secure RSA padding scheme available.
2. Using the now-recovered AES session key, it **decrypts `data`** using AES-256-GCM and the provided `iv` and `tag`. The GCM auth tag is verified automatically — if the payload was tampered with even by 1 bit, decryption fails with an error.
3. The decrypted JSON is parsed and set as `req.body`. Every controller downstream sees a normal, plaintext request object — no changes needed anywhere else.
4. **The response is also encrypted.** Before `res.json()` sends data back, the middleware intercepts it, encrypts the response JSON using the same AES session key, and sends `{ data, iv, tag }` back.
5. After the response is sent, the AES key buffer is explicitly overwritten with zeros (`aesKeyBuffer.fill(0)`) to remove it from memory. This prevents it from being recovered through a memory dump.

**What "GCM" means and why it matters:**

GCM stands for **Galois/Counter Mode**. Unlike basic AES-CBC, GCM is an **Authenticated Encryption** mode. This means it does not just encrypt — it also produces a 16-byte **Authentication Tag** that mathematically proves:
- The data was encrypted by someone who had the correct key.
- The data was not modified in transit (even by flipping a single bit).

This makes AES-256-GCM immune to **padding oracle attacks** and **bit-flipping attacks** that plague older encryption modes like AES-CBC.

**Scope of Encryption:**

The middleware applies to all `POST`, `PUT`, `PATCH`, and `DELETE` requests. `GET` requests are not encrypted because they carry no sensitive body payload. Multipart file uploads (`multipart/form-data`) are excluded because binary files cannot be JSON-serialised for encryption. The system is also togglable via `ENABLE_PAYLOAD_ENCRYPTION` in the environment, allowing it to be disabled during local development.

**The Trade-off:**

- **Downside:**
  - RSA decryption of the AES key takes ~1–5ms per request (CPU cost of asymmetric cryptography). This is unavoidable when using RSA.
  - The frontend must fetch the server's RSA public key on startup and implement the client-side encryption logic. This adds development complexity.
  - AES-256-GCM requires a unique IV for every single encryption. The system generates a fresh random 12-byte IV per request using `crypto.randomBytes(12)`, which is cryptographically secure.
- **Upside:**
  - Even if a network proxy strips TLS or intercepts traffic at the infrastructure level, every request and response payload is separately encrypted with a unique session key. An attacker who intercepts one request cannot decrypt any other.
  - The GCM authentication tag means any tampering with the payload is detected and rejected before the data ever reaches a controller.
  - Session keys are ephemeral — they live only for the duration of one request and are then wiped from memory. There is no long-lived encryption key that could be stolen to decrypt past traffic.

---

## 2. Two-Token Authentication (Access Token + Refresh Token)

**The Problem:**

If we use a single long-lived JWT (e.g., valid for 30 days), a stolen token gives an attacker full access for 30 days. There is no way to invalidate it without changing the secret key (which would log out every user). On the other hand, a very short-lived token (e.g., 15 minutes) forces users to log in every 15 minutes, which is terrible UX.

**What We Did:**

We use a two-token system:
- **Access Token**: Short-lived JWT (e.g., 15 minutes). Used for every authenticated API request. Verified purely by signature — zero database calls.
- **Refresh Token**: Long-lived token (7 days). Stored in Redis under the key `refresh:{userId}`. Used only to obtain a new Access Token when the old one expires.

When a user logs out, we call `redis.del('refresh:{userId}')`. The refresh token is immediately invalidated. Even if someone stole the refresh token, it is useless after logout.

**The Trade-off:**
- **Downside:** Every token refresh requires one Redis read to validate the stored refresh token matches the one sent. This adds a minor overhead.
- **Upside:** Revocation is instant and surgical. We can log out one user without affecting anyone else. The short-lived access token means even a stolen access token expires in minutes.

---

## 3. OTP-Gated Registration (Email Verification Before Account Creation)

**The Problem:**

If anyone can create an account with any email address without verification, the system is open to spam registrations and fake accounts.

**What We Did:**

Registration is a two-step process:
1. **Step 1** — The user submits their name and email. A 6-digit OTP is generated, stored in Redis with a 10-minute TTL (`otp:{email}`), and sent via the email queue.
2. **Step 2** — The user submits the OTP along with their password. The API reads `otp:{email}` from Redis, compares it, and only then creates the account.

This guarantees that every account in the system belongs to a real, verified email address.

**The Trade-off:**
- **Downside:** It adds one extra step to the registration flow, which slightly increases drop-off. However, for an LMS where payment is involved, verified accounts are non-negotiable.
- **Upside:** No bots can auto-register. No user can use someone else's email. OTPs are stored only in Redis (fast, auto-expiring) — they never touch MongoDB.

---

## 4. Encrypted Email at Rest (with Hash-Based Lookup)

**The Problem:**

User emails are Personally Identifiable Information (PII). If the database is ever breached, plaintext emails expose all users to phishing and identity theft. However, standard encryption makes it impossible to search the database — you cannot index an encrypted string.

**What We Did:**

The `User` model uses a pre-validate Mongoose hook:
- The actual `email` field is encrypted with AES before saving to MongoDB.
- A separate `emailHash` field stores a deterministic one-way SHA-256 hash of the plaintext email, with a unique index on it.

For login and OTP lookup, we hash the incoming email and search by `emailHash`. The query hits the index and resolves in under 1ms. The actual encrypted email is never used for searching.

**The Trade-off:**
- **Downside:** If the encryption key is lost, emails cannot be decrypted. The key must be stored securely (environment variable, secret manager). Also, the hash is deterministic — the same email always produces the same hash — so it is theoretically vulnerable to rainbow table attacks if the salt is weak. A strong pepper in the hash function mitigates this.
- **Upside:** Even if the database is fully dumped, email addresses cannot be read. We achieve both security and queryability simultaneously.

---

## 5. Role-Based Access Control (RBAC) via Middleware

**The Problem:**

Not every route should be accessible to every user. Students must not be able to access admin dashboards, and unauthenticated users must not be able to access course content they have not paid for.

**What We Did:**

We have three middleware functions that compose into a security chain:
- `authenticate`: Verifies the Bearer JWT. Attaches `req.user` (userId + role) to the request. Rejects with 401 if missing or expired.
- `optionalAuth`: Same as authenticate but does not reject if no token is present. Used for public routes where we want to enhance the response for logged-in users (e.g., checking if they are enrolled).
- `requireRole('admin')`: Checks `req.user.role`. Rejects with 403 if the role does not match.

In `lesson.service.ts`, the `checkAccess` function enforces enrollment-based access: if a lesson is not a free preview, and the user is not an admin, it verifies an active enrollment exists in the database before serving any lesson content.

**The Trade-off:**
- **Downside:** Every protected lesson request requires one extra `Enrollment.findOne()` database query for the access check. This adds ~10-20ms.
- **Upside:** There is no way to access paid content without a valid enrollment record in the database. Even if a student guesses a lesson ID, they cannot retrieve it without being enrolled.

---

## 6. Payment Signature Verification (Razorpay HMAC)

**The Problem:**

After a student completes a Razorpay payment on the frontend, the frontend sends us the payment ID. How do we know the payment is real and not fabricated by a student who just typed a fake payment ID to get free access?

**What We Did:**

Razorpay provides an HMAC-SHA256 signature with every completed payment. This signature is computed from `orderId|paymentId` using our Razorpay secret key. We independently recompute this signature on our server and compare using `crypto.timingSafeEqual()` (which prevents timing attacks that could leak the secret via response time differences).

Only after signature verification passes do we:
1. Fetch the payment from Razorpay to verify the amount matches our order.
2. Mark the payment as `paid` in our database.
3. Call `createEnrollment` to give the student access.

The `razorpaySignature` itself is encrypted before being stored in the Payment document.

**The Trade-off:**
- **Downside:** The Razorpay API call to fetch and verify the payment amount adds an extra external network call, adding ~200ms to the payment confirmation flow.
- **Upside:** It is impossible to fabricate a payment. A student cannot gain course access without a real, captured Razorpay payment whose amount matches what we charged. This protects all revenue.

---

## 7. Video Content Protection (JWT-Gated HLS Streaming)

**The Problem:**

HLS playlists contain URLs to video chunks. If these URLs are permanent and public, anyone — paying student or not — can share them and watch videos for free.

**What We Did:**

When a student hits "Play", the API generates a short-lived **Video JWT Token** signed with a separate `VIDEO_TOKEN_SECRET`. This token encodes:
- `userId` — who is allowed to watch
- `lessonId` — which lesson
- `courseId` — which course
- `storagePath` — the exact storage path authorised

Every request for a playlist (`.m3u8`) or a video chunk must include this token. The server:
1. Verifies the JWT signature.
2. Confirms the requested path starts with the `storagePath` from the token — preventing any path traversal to other lessons.
3. For actual video segments (`.ts` files), generates fresh pre-signed cloud storage URLs that expire in seconds.

**The Trade-off:**
- **Downside:** Every chunk request involves a JWT verification and a pre-signed URL generation. These are cryptographic in-memory operations (no DB calls) that add under 1ms each.
- **Upside:** Shared video URLs are useless within seconds. Students from Course A cannot access videos from Course B by guessing paths. Content is fully protected at the delivery layer.
