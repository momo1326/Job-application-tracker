# Job Application Tracker SaaS

Full-stack SaaS starter with a TypeScript/Express backend and React dashboard frontend.

## Features
- JWT auth with access + refresh tokens
- Password hashing and protected routes
- Role-based access control (ADMIN/USER)
- Email verification + password reset via tokenized email links
- Rate limiting on auth endpoints
- Logging (`morgan`) + centralized error middleware
- PostgreSQL + Prisma with relations, indexes, pagination, filtering, and sorting
- Dashboard UI with status cards + monthly analytics
- Deployment configs for Render (API) and Vercel (frontend)

## Backend setup
1. Copy envs: `cp .env.example .env`
2. Install deps: `npm install`
3. Generate prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`
5. Start API: `npm run dev`

## Frontend setup
1. `cd frontend && npm install`
2. `npm run dev`

## API endpoints
- `POST /api/auth/register`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `POST /api/applications` (auth)
- `GET /api/applications` (auth; supports `page,pageSize,status,company,sortBy,sortOrder`)
- `GET /api/applications/analytics` (auth)
- `GET /api/applications/admin/users` (admin only)
