# CampusVote

A full-stack democratic voting platform for Indian colleges.

**Stack:** React (Vite) + TailwindCSS + Framer Motion · Node.js + Express · PostgreSQL + Prisma · Redis · JWT · Nodemailer

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| PostgreSQL | ≥ 14 |
| Redis | ≥ 6 |
| npm | ≥ 8 |

---

## Project Structure

```
campusvote/
├── backend/         # Express API
│   ├── prisma/      # Schema + seed
│   └── src/         # Controllers, routes, middleware, services
└── frontend/        # React app (Vite)
    └── src/         # Pages, components, context, hooks
```

---

## Setup

### 1. Clone and navigate

```bash
cd campusvote
```

### 2. Backend setup

```bash
cd backend
npm install
```

Copy and fill environment variables:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/campusvote"
REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="your-super-secret-access-key-at-least-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-at-least-32-chars"
JWT_TEMP_SECRET="your-super-secret-temp-key-at-least-32-chars"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="CampusVote <noreply@campusvote.in>"

PORT=5000
FRONTEND_URL="http://localhost:5173"
```

> **Gmail setup:** Enable 2FA → App Passwords → generate a 16-char app password and use it as `SMTP_PASS`.

### 3. Database setup

```bash
# Push schema to database
npx prisma db push

# Seed institutions + create SuperAdmin
npm run db:seed
```

This seeds **20 Indian colleges** and creates a SuperAdmin account:
- Email: `superadmin@campusvote.in`
- Password: `SuperAdmin@123`

> Change `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `.env` before seeding if desired.

### 4. Frontend setup

```bash
cd ../frontend
npm install
```

### 5. Start development servers

**Backend** (in `/backend`):
```bash
npm run dev
# → API running at http://localhost:5000
```

**Frontend** (in `/frontend`):
```bash
npm run dev
# → App running at http://localhost:5173
```

---

## Creating Additional Admin Accounts

Currently, only SuperAdmin can manage all institutions. To create an institution admin, use Prisma Studio:

```bash
cd backend
npm run db:studio
```

Open http://localhost:5555 → Admin model → Add record:
- `email`: admin@institution.edu.in
- `passwordHash`: use bcrypt to hash your password
- `institutionId`: institution's UUID
- `isSuperAdmin`: false

Or add a CLI script:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('AdminPass@123', 12);
  await prisma.admin.create({
    data: { email: 'admin@bennett.edu.in', passwordHash: hash, institutionId: 'INSTITUTION_UUID_HERE' }
  });
  console.log('Admin created');
  await prisma.\$disconnect();
})();
"
```

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens (15 min expiry) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (7 day expiry) |
| `JWT_TEMP_SECRET` | Secret for OTP verification temp tokens |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (587 for TLS) |
| `SMTP_USER` | SMTP username / email |
| `SMTP_PASS` | SMTP password / app password |
| `SMTP_FROM` | From address for emails |
| `PORT` | Backend server port (default: 5000) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `SUPER_ADMIN_EMAIL` | SuperAdmin email (used during seed) |
| `SUPER_ADMIN_PASSWORD` | SuperAdmin password (used during seed) |

---

## API Overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | — | Send OTP to college email |
| POST | `/api/auth/verify-otp` | — | Verify OTP, get temp token |
| POST | `/api/auth/signup` | — | Create student account |
| POST | `/api/auth/login` | — | Student login |
| POST | `/api/auth/admin/login` | — | Admin login |
| POST | `/api/auth/refresh` | — | Refresh tokens |
| GET | `/api/institutions` | — | List all institutions |
| GET | `/api/events` | Student | List events for institution |
| GET | `/api/events/:id` | Student | Event detail + candidates |
| POST | `/api/events/:id/vote` | Student | Cast vote |
| GET | `/api/admin/events` | Admin | List admin's events |
| POST | `/api/admin/events` | Admin | Create event |
| PUT | `/api/admin/events/:id` | Admin | Update event |
| DELETE | `/api/admin/events/:id` | Admin | Delete event |
| POST | `/api/admin/events/:id/candidates` | Admin | Add candidate (multipart) |
| DELETE | `/api/admin/events/:id/candidates/:cid` | Admin | Remove candidate |
| POST | `/api/admin/events/:id/publish-results` | Admin | Publish results |
| GET | `/api/admin/events/:id/stats` | Admin | Live vote stats |

---

## Security Features

- Email suffix validation on signup (frontend + backend)
- OTP hashed with SHA-256 before Redis storage (10-minute TTL)
- Unique constraint prevents double voting at DB level
- JWT: 15-min access tokens, 7-day refresh tokens
- Rate limiting: 3 OTP requests/hour per email, 10 logins/15min per IP
- Votes are immutable — no delete/update API routes
- Results hidden from students until admin explicitly publishes

---

## Voting ID Format

Auto-generated on signup: `CV-<INSTITUTION_CODE>-<RANDOM_8_CHARS>`

Example: `CV-BNT-A3F7K2PQ` (Bennett University)

---

## Supported Institutions (Seeded)

Bennett University · LPU · Manipal · VIT · SRM · Amity · Sharda · Symbiosis · Chitkara · Chandigarh University · Thapar · BITS Pilani · DTU · Jamia Millia Islamia · NMIMS · Presidency University · Christ University · Parul University · Graphic Era · KIIT
