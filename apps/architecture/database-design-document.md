# veoLMS Database Architecture & Design Decisions

This document explains the database design for veoLMS. We chose MongoDB (NoSQL) because it gives us the flexibility to build a fast, scalable learning platform. Below are the real-world challenges we faced, how we solved them, and the trade-offs we accepted. The goal was to keep the architecture simple but perfect for an enterprise-level application, without over-engineering things.

## 1. Handling Course Structure (Sections & Lessons)
**The Challenge:** A course is made up of sections, and sections contain lessons. We needed a way to fetch a course quickly without making the database slow when the course gets very large.

**Our Solution (The Design):** 
- We embedded `Sections` directly inside the `Course` document. 
- However, we kept `Lessons` in a separate, dedicated collection and only linked them by `courseId` and `sectionId`.

**The Trade-off:**
- A course only has a few sections (like 5 to 15), so embedding them makes loading a course super fast (no extra database queries needed). 
- But a course can have hundreds of lessons, and lessons contain huge data like video processing details. If we embedded lessons too, the `Course` document would become too heavy and hit MongoDB's 16MB limit. By keeping lessons separate, fetching a course is fast, and updating a lesson's video status won't block the course data.

## 2. Securing User Data (PII)
**The Challenge:** We must protect user privacy (like emails) to meet security standards, but we also need to log users in quickly by searching for their email.

**Our Solution (The Design):** 
- We encrypted the `email` field in the `User` database and the `razorpaySignature` in the `Payment` database. 
- To allow fast logins, we added an `emailHash` field. When a user logs in, we hash the email they typed and match it against the `emailHash` in the database.

**The Trade-off:**
- You cannot easily search or filter encrypted data using normal database indexes. By storing a one-way `emailHash`, we get the best of both worlds: 100% data security for the actual email, and lightning-fast search capability for user logins.

## 3. Tracking Video Progress
**The Challenge:** When a student watches a video, the system updates their watched progress every few seconds. If thousands of students are watching, this means massive write operations to the database.

**Our Solution (The Design):** 
- We created a completely separate `Progress` collection just to track `watchedSeconds` per user, per lesson.

**The Trade-off:**
- We could have just put a "progress" array inside the `User` or `Enrollment` models. However, that would mean constantly updating and locking core user data every 5 seconds. By separating `Progress` into its own table, the core tables stay clean and fast, and the database can handle thousands of progress updates at the same time without crashing.

## 4. Showing Course Statistics
**The Challenge:** When users browse courses, they want to see the average rating and the total number of enrolled students. Calculating this on the fly for every single course on the page is very slow.

**Our Solution (The Design):** 
- We used Denormalization. We store `enrollmentCount`, `rating.average`, and `rating.count` directly on the `Course` document.

**The Trade-off:**
- The downside is that every time a new student enrolls or leaves a review, we have to run an extra update query to change these numbers on the course. 
- The upside is massive: LMS platforms are "read-heavy" (people browse way more than they buy). So, taking a fraction of a millisecond longer to save data is totally worth it to make the website load instantly for everyone browsing.

## 5. Coupon System Scaling
**The Challenge:** We need to offer discount coupons, but we must track exactly who used which coupon so they don't use it twice.

**Our Solution (The Design):** 
- Instead of keeping a list of users inside the `Coupon` document, we made a separate `CouponUsage` collection. It simply maps a `userId` to a `couponId`.

**The Trade-off:**
- Arrays in MongoDB get very slow if they grow too large. If we release a popular 100% off coupon and 10,000 people use it, storing 10,000 users inside one `Coupon` document would cause bad performance. Separating them means we can scale infinitely and easily track redemptions.

## 6. Preventing Duplicate Entries
**The Challenge:** Sometimes, due to slow internet or double-clicking, an API might try to enroll a student twice in the same course, or issue two certificates.

**Our Solution (The Design):** 
- We used Compound Unique Indexes directly in the database. For example, `(userId, courseId)` must be unique in the `Enrollment` and `Certificate` collections.

**The Trade-off:**
- Indexes take up a little bit of extra memory in the database. However, relying only on backend code (like `if (userAlreadyEnrolled)`) is risky because of race conditions. Enforcing it at the database level guarantees 100% data integrity—no user will ever be charged or enrolled twice for the same course.
