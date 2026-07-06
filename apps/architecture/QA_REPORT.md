# VeoLMS QA Report

Manual test matrix for submission verification. Run against **local** (`localhost`) before deploy, then re-run on **production URL** and update the “Deployed” column.

**Tester:** _your name_  
**Date:** _fill on final QA pass_  
**Environment:** Local dev / Staging / Production

**Credentials (seed):**

| Role | Email | Password |
|---|---|---|
| Admin | admin@veolms.com | Admin@123456 |
| Student | student@veolms.com | Student@123456 |

---

## 1. Public access (no login)

| # | Test case | Steps | Expected | Local | Deployed |
|---|---|---|---|:---:|:---:|
| P1 | Homepage loads | Open `/` | Hero, featured courses, navbar | ☐ | ☐ |
| P2 | Course discovery | Browse course cards | Thumbnails, price, instructor visible | ☐ | ☐ |
| P3 | Search | Search “React” | Matching courses returned | ☐ | ☐ |
| P4 | Course detail | Open `/courses/:slug` | Title, curriculum, trailer, CTA | ☐ | ☐ |
| P5 | Preview lesson | Open preview lesson without login | Video plays (YouTube or HLS) | ☐ | ☐ |
| P6 | Paid lesson blocked | Open non-preview lesson URL while logged out | Redirect to login or 403 | ☐ | ☐ |

---

## 2. Authentication & authorization

| # | Test case | Steps | Expected | Local | Deployed |
|---|---|---|---|:---:|:---:|
| A1 | Student register | `/register` new email | Account created, logged in | ☐ | ☐ |
| A2 | Student login | Login with seed student | Dashboard accessible | ☐ | ☐ |
| A3 | Admin login | Login admin credentials | `/admin` accessible | ☐ | ☐ |
| A4 | Logout | Click logout | Protected routes redirect to login | ☐ | ☐ |
| A5 | Student → admin | Student opens `/admin` | 403 / redirect unauthorized | ☐ | ☐ |
| A6 | Token refresh | Wait or force 401 | Silent refresh, session continues | ☐ | ☐ |

---

## 3. Payments & enrollment

| # | Test case | Steps | Expected | Local | Deployed |
|---|---|---|---|:---:|:---:|
| E1 | Create order | Student clicks Enroll on paid course | Razorpay checkout opens (test mode) | ☐ | ☐ |
| E2 | Successful payment | Complete test payment | Verify API → enrollment created | ☐ | ☐ |
| E3 | Course in dashboard | Check My Courses | Enrolled course appears with progress | ☐ | ☐ |
| E4 | Invalid signature | Tamper verify payload | 400, no enrollment | ☐ | ☐ |
| E5 | Duplicate verify | Submit same payment twice | 409 / idempotent reject | ☐ | ☐ |

---

## 4. Student learning experience

| # | Test case | Steps | Expected | Local | Deployed |
|---|---|---|---|:---:|:---:|
| L1 | Learn page | Open `/learn/:slug/:lessonId` | Player + lesson sidebar | ☐ | ☐ |
| L2 | HLS playback | Play uploaded HLS lesson | Multi-quality, no console errors | ☐ | ☐ |
| L3 | Progress save | Watch 30+ seconds | Progress API updates | ☐ | ☐ |
| L4 | Resume playback | Leave and return | Resumes near saved position | ☐ | ☐ |
| L5 | Continue learning | Dashboard widget | Shows last watched lesson | ☐ | ☐ |
| L6 | Keyboard shortcuts | Space, arrows, F | Player responds | ☐ | ☐ |
| L7 | Fullscreen / PiP | Use player controls | Works in supported browser | ☐ | ☐ |

---

## 5. Admin operations

| # | Test case | Steps | Expected | Local | Deployed |
|---|---|---|---|:---:|:---:|
| AD1 | Create course | Admin → new course | Saved, appears in list | ☐ | ☐ |
| AD2 | Add section/lesson | Course editor | Lesson attached to section | ☐ | ☐ |
| AD3 | Upload video | Upload MP4 to lesson | Job queued → status → ready | ☐ | ☐ |
| AD4 | Publish toggle | Publish/unpublish course | Public listing updates | ☐ | ☐ |
| AD5 | View students | Admin students page | List loads, search works | ☐ | ☐ |
| AD6 | View enrollments | Admin enrollments | Shows payment linkage | ☐ | ☐ |
| AD7 | Announcement | Send broadcast | In-app notification + optional email | ☐ | ☐ |
| AD8 | Export courses | JSON or CSV export | File downloads | ☐ | ☐ |

---

## 6. Security & video delivery

| # | Test case | Steps | Expected | Local | Deployed |
|---|---|---|---|:---:|:---:|
| S1 | No token on stream | `GET /api/videos/stream/...` without token | 401 | ☐ | ☐ |
| S2 | Expired video JWT | Use old token on playlist | 403 | ☐ | ☐ |
| S3 | Path traversal | Token + `../../../` path | 400 / 403 | ☐ | ☐ |
| S4 | Unenrolled video URL | Student requests paid lesson video-url | 403 | ☐ | ☐ |
| S5 | Direct R2 guess | Open public R2 URL to `videos/.../segment.ts` | 403 / not found (bucket private) | ☐ | ☐ |
| S6 | Rate limit auth | 11+ failed logins in 15 min | 429 on auth routes | ☐ | ☐ |

---

## 7. Automated tests (CI / local)

| Suite | Command | Expected |
|---|---|---|
| Server API tests | `npm run test -w @veolms/server` | All pass |
| Auth | `tests/api/auth/` | Register, login cases |
| Course | `tests/api/course/` | Admin create, student forbidden |
| Payment | `tests/api/payment/` | Verify, duplicate, invalid sig |
| Enrollment | `tests/api/enrollment/` | Lesson access control |
| Integration | `tests/integration/` | Auth, payment, upload flows |

---

## 8. UI / themes / responsive

| # | Test case | Viewport | Expected | Local | Deployed |
|---|---|---|---|:---:|:---:|
| U1 | Mobile layout | 375px | No horizontal scroll, nav usable | ☐ | ☐ |
| U2 | Tablet | 768px | Course grid readable | ☐ | ☐ |
| U3 | Dark theme | Theme switcher | Colors consistent | ☐ | ☐ |
| U4 | Color themes | green / blue / rose | Accent updates globally | ☐ | ☐ |
| U5 | Sharp radius | Radius toggle | Cards/buttons update | ☐ | ☐ |

---

## 9. Known limitations (not bugs)

| Item | Notes |
|---|---|
| Screen recording | Possible — no DRM by design |
| Email in dev | May use Ethereal; check SMTP env in prod |
| Long video + old uploads | Re-transcode applies new private cache headers |
| YouTube lessons | Depend on YouTube availability / embed policy |

---

## Sign-off

| Check | Status |
|---|---|
| All mandatory flows pass locally | ☐ |
| All mandatory flows pass on deployed URL | ☐ |
| Automated test suite green | ☐ |
| Security spot-checks (S1–S5) pass | ☐ |
| Ready for submission email | ☐ |

---

## Related docs

- [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md)
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
