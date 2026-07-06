# 29. COUPON MANAGEMENT SYSTEM

## 29.1 Overview

The Coupon Management System allows administrators to create discount coupons that students can apply during course checkout.

Supported Features:

* Fixed Discount Coupons
* Percentage Discount Coupons
* Course Specific Coupons
* Global Coupons
* Usage Limits
* Expiry Dates
* Active / Inactive Status
* Coupon Analytics

The goal is to increase enrollments and run promotional campaigns without introducing unnecessary complexity.

---

# 29.2 Coupon Types

### Fixed Discount

Example:

Course Price: ₹4999

Coupon:

WELCOME1000

Discount:

₹1000

Final Price:

₹3999

---

### Percentage Discount

Example:

Course Price: ₹5000

Coupon:

SAVE20

Discount:

20%

Final Price:

₹4000

---

# 29.3 Coupon Schema

```ts
{
  _id: ObjectId,

  code: string,

  description: string,

  type: 'fixed' | 'percentage',

  value: number,

  maxDiscountAmount: number | null,

  usageLimit: number | null,

  usedCount: number,

  validFrom: Date,

  validUntil: Date,

  applicableCourses: ObjectId[],

  isActive: boolean,

  createdAt: Date,
  updatedAt: Date
}
```

### Notes

code

```ts
WELCOME1000
```

must be unique.

---

For percentage coupons:

```ts
type: "percentage"
value: 20
```

means 20% off.

---

For fixed coupons:

```ts
type: "fixed"
value: 1000
```

means ₹1000 off.

---

# 29.4 Payment Schema Changes

Add coupon information to payment records.

```ts
{
  ...

  couponId: ObjectId | null,

  couponCode: string | null,

  originalAmount: number,

  discountAmount: number,

  finalAmount: number
}
```

Example:

```json
{
  "originalAmount": 4999,
  "discountAmount": 1000,
  "finalAmount": 3999
}
```

---

# 29.5 Coupon Usage Collection

Track coupon redemptions.

```ts
{
  _id: ObjectId,

  couponId: ObjectId,

  userId: ObjectId,

  courseId: ObjectId,

  paymentId: ObjectId,

  couponCode: string,

  discountAmount: number,

  redeemedAt: Date
}
```

Indexes:

```ts
{ couponId: 1 }
{ userId: 1 }
{ courseId: 1 }
```

---

# 29.6 Validation Rules

Coupon is valid only when:

* Coupon exists
* Coupon is active
* Current date is between validFrom and validUntil
* Usage limit not exceeded
* Course is eligible

Validation order:

1. Coupon exists
2. Coupon active
3. Not expired
4. Usage available
5. Course eligible

---

# 29.7 Checkout Flow

Step 1

Student enters coupon code.

```text
WELCOME1000
```

---

Step 2

Frontend validates coupon.

```http
POST /api/coupons/validate
```

Request:

```json
{
  "courseId": "course_id",
  "couponCode": "WELCOME1000"
}
```

---

Step 3

Backend calculates discount.

Example:

```json
{
  "success": true,
  "data": {
    "originalAmount": 4999,
    "discountAmount": 1000,
    "finalAmount": 3999
  }
}
```

---

Step 4

Frontend displays:

```text
Course Price       ₹4999
Discount          -₹1000
-------------------------
Payable Amount     ₹3999
```

---

Step 5

Student proceeds to payment.

```http
POST /api/payments/create-order
```

Request:

```json
{
  "courseId": "...",
  "couponCode": "WELCOME1000"
}
```

Backend recalculates coupon before creating Razorpay order.

Never trust frontend values.

---

# 29.8 Coupon Calculation Logic

Fixed Discount:

```ts
discount = coupon.value
```

Example:

```ts
5000 - 1000 = 4000
```

---

Percentage Discount:

```ts
discount = (coursePrice * coupon.value) / 100
```

Example:

```ts
5000 * 20 / 100
= 1000
```

Final:

```ts
5000 - 1000
= 4000
```

---

Maximum discount protection:

```ts
if (
  coupon.maxDiscountAmount &&
  discount > coupon.maxDiscountAmount
) {
  discount = coupon.maxDiscountAmount
}
```

---

# 29.9 Admin Coupon Management

Page:

```text
/admin/coupons
```

Features:

* View Coupons
* Create Coupon
* Edit Coupon
* Enable Coupon
* Disable Coupon
* Delete Coupon

---

Table Columns

* Coupon Code
* Type
* Value
* Used Count
* Expiry Date
* Status
* Actions

---

# 29.10 Create Coupon Form

Basic Information

```text
Coupon Code
Description
```

Discount

```text
Type

Fixed
Percentage

Value

Maximum Discount Amount
```

Restrictions

```text
Usage Limit

Applicable Courses
```

Schedule

```text
Start Date

End Date
```

Status

```text
Active / Inactive
```

---

# 29.11 REST APIs

Public

```http
POST /api/coupons/validate
```

---

Admin

```http
GET    /api/admin/coupons

GET    /api/admin/coupons/:id

POST   /api/admin/coupons

PUT    /api/admin/coupons/:id

PATCH  /api/admin/coupons/:id/status

DELETE /api/admin/coupons/:id
```

---

# 29.12 Coupon Analytics

Simple dashboard metrics.

Show:

* Total Coupons
* Active Coupons
* Total Redemptions
* Total Discount Given

Example:

```text
Coupons Created: 12

Active Coupons: 5

Total Redemptions: 187

Discount Given: ₹1,25,000
```

---

# 29.13 Security Rules

Never trust frontend amounts.

Always recalculate coupon discounts on server.

---

Validate coupon again during payment verification.

```http
POST /api/payments/verify
```

---

Increment coupon usage only after successful payment.

```ts
coupon.usedCount += 1
```

---

Prevent expired coupons from being used.

---

# 29.14 Redis Caching

Cache Key:

```text
coupon:{code}
```

TTL:

```text
300 seconds
```

Invalidate cache when:

* Coupon Updated
* Coupon Deleted
* Coupon Disabled

---

# 29.15 Development Tasks

Phase 4.5 — Coupon System

□ Coupon Schema

□ Coupon Usage Schema

□ Coupon CRUD APIs

□ Coupon Validation Service

□ Checkout Coupon UI

□ Razorpay Integration

□ Coupon Analytics

□ Admin Coupon Management Page

□ Redis Cache

□ Testing
