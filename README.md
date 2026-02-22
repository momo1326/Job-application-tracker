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
- Frontend auth (signup/login) + dashboard with filters, sorting, pagination, create, and delete actions
- Frontend auth with automatic token refresh session handling
- Dashboard UI with status cards + status-distribution chart
- Inline application editing (company/title/status) with save/cancel controls
- Admin dashboard section for user list + application counts (ADMIN role)
- Deployment configs for Render (API) and Vercel (frontend)

## Backend setup
1. Copy envs: `cp .env.example .env`
2. Install deps: `npm install`
3. Generate prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`
5. Start API: `npm run dev`

## Frontend setup
1. `cd src/frontend && npm install`
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
- `PATCH /api/applications/:id` (auth)
- `DELETE /api/applications/:id` (auth)
- `GET /api/applications/analytics` (auth)
- `GET /api/applications/admin/users` (admin only)

## Testing
- Run backend tests: `npm test`
- Route tests cover:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/applications`
  - `POST /api/applications`
	- `PATCH /api/applications/:id`
  - `DELETE /api/applications/:id`
	- `GET /api/applications/admin/users`

## Frontend environment
Set `src/frontend/.env`:

```bash
VITE_API_BASE_URL=https://your-backend-url
```

When not set, frontend defaults to `http://localhost:4000`.

## Deployment

### Backend (Render)
1. Create a PostgreSQL database (Render or external).
2. Create a Render Web Service pointing to this repository.
3. Use:
	- Build command: `npm install && npm run prisma:generate && npm run build`
	- Start command: `npm run start`
4. Add env vars:
	- `DATABASE_URL`
	- `JWT_ACCESS_SECRET`
	- `JWT_REFRESH_SECRET`
	- `APP_URL` (frontend URL)
	- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
5. Run migrations once: `npm run prisma:migrate`.

### Frontend (Vercel)
1. Import the `src/frontend/` directory as a Vercel project.
2. Set environment variable `VITE_API_BASE_URL` to your Render backend URL.
3. Deploy.
