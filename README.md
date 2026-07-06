# VeoLMS

A production-like Learning Management System built for the VeoLMS Core Team Selection Challenge.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, Zustand |
| Backend | Node.js 22, Express 5, TypeScript, Mongoose |
| Database | MongoDB |
| Cache | Redis |
| Payments | Razorpay (test mode) |
| Video | YouTube embeds with progress tracking |

## Features

- Public homepage with featured courses and search
- Course detail pages with curriculum and preview lessons
- Student registration, login, and protected routes
- Razorpay test payment and enrollment flow
- Student dashboard with progress tracking and continue learning
- Admin panel: courses, sections, lessons, students, enrollments, announcements
- 7 theme support (light, dark, green + more)
- AES-GCM email encryption at rest
- JWT auth with httpOnly refresh token cookies

## Quick Start

### Prerequisites

- Node.js 22+
- Docker (for MongoDB and Redis)

### Setup

```bash
# Start databases
docker compose up -d

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build shared package
npm run build -w @veolms/shared

# Seed database
npm run seed

# Start dev servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@veolms.com | Admin@123456 |
| Student | student@veolms.com | Student@123456 |

## Project Structure

```
veolms/
├── apps/
│   ├── client/     # React frontend
│   └── server/     # Express backend
├── packages/
│   └── shared/     # Shared types and Zod schemas
├── docker-compose.yml
└── .env.example
```

## API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/courses | Public |
| GET | /api/courses/:slug | Public |
| POST | /api/payments/create-order | Student |
| POST | /api/payments/verify | Student |
| GET | /api/admin/stats | Admin |
| POST | /api/courses | Admin |

## Razorpay Setup

1. Create a test account at https://razorpay.com
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`
3. Add `VITE_RAZORPAY_KEY_ID` to `apps/client/.env`

## Deployment

- Frontend: Vercel (`npm run build -w @veolms/client`)
- Backend: Railway (`npm run build -w @veolms/server && npm start -w @veolms/server`)
- Database: MongoDB Atlas (free M0)
- Cache: Redis Cloud (free tier)

## Estimated Monthly Cost

| Service | Cost |
|---|---|
| Vercel | Free |
| Railway | ~$5/mo |
| MongoDB Atlas M0 | Free |
| Redis Cloud | Free |
| **Total** | **~₹0–₹500/mo** |

## API Documentation

Development

http://localhost:5001/api/docs

OpenAPI JSON

http://localhost:5001/api/docs.json

