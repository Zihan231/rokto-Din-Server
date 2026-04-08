# Rokto Din Server

Rokto Din Server is the backend API for the Rokto Din blood donation platform. It manages donor registration, authentication, donor discovery, donation records, and contact requests.

The service is built with NestJS, TypeORM, and PostgreSQL, and uses secure cookie-based JWT authentication for protected routes.

## Core Features

- Donor registration with validation for blood group, division, district, and contact methods
- Cookie-based authentication (HTTP-only JWT)
- Password change, forgot-password, and reset-password flows
- Donor profile management and availability status updates
- Donation record creation with eligibility rules (date checks and minimum interval)
- Search API for eligible donors based on blood group and location
- Contact form capture with admin email notifications
- Total donor and donation count endpoints for dashboard/statistics use cases

## Tech Stack

- Framework: NestJS 11
- Language: TypeScript
- Database: PostgreSQL
- ORM: TypeORM
- Auth: JWT + `bcrypt`
- Mail: Nodemailer (Brevo SMTP)

## Project Structure

```text
src/
  auth/      Authentication and password flows
  donor/     Donor registration, profile, status, donation records
  user/      Donor search, contact form, aggregate counters
  mail/      Outbound email service
  Entity/    TypeORM entities and enums
  dto/       Request validation DTOs
```

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm
- PostgreSQL database (or hosted Postgres such as Neon)

## Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000
FRONTEND_URL=http://localhost:3001

DATABASE_URL=postgresql://username:password@host:5432/database

JWT_SECRET=your_jwt_secret
JWT_EXPIRES=1h
JWT_RESET_SECRET=your_reset_secret

BREVO_USER=your_brevo_smtp_user
BREVO_PASS=your_brevo_smtp_password
BREVO_FROM=verified_sender@example.com
ADMIN_EMAIL=admin@example.com

# Optional legacy DB vars (currently not used while DATABASE_URL is active)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=rokto_din
```

## Installation

```bash
npm install
```

## Running the Server

```bash
# development
npm run start:dev

# standard run
npm run start

# production
npm run build
npm run start:prod
```

Server starts on `PORT` (default `3000`).

## Authentication Notes

- Login sets a `jwt` HTTP-only cookie.
- Protected routes read this cookie using `AuthGuard`.
- Frontend requests must send credentials (cookies) with CORS enabled.
- In production, the cookie is configured with `secure: true` and `sameSite: none`, so HTTPS is required.

## API Overview

### Health / Root

- `GET /` - Basic service message
- `GET /donor/test` - Donor service check
- `GET /user/test` - User service check

### Auth Routes

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/change-password` (protected)
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Donor Routes

- `POST /donor/create`
- `GET /donor/profile` (protected)
- `POST /donor/edit-profile` (protected)
- `PATCH /donor/update-status?status=onn|off` (protected)
- `POST /donor/create-donation-record` (protected)
- `GET /donor/donation-records` (protected, supports `page`, `limit`, `hospitalName`, `sort`)

### User Routes

- `POST /user/search` (find eligible donors by blood group/location)
- `POST /user/contact` (store and forward contact message)
- `GET /user/counts` (total donors and total donations)

## Business Rules Implemented

- At least one donor contact method is required (phone, WhatsApp, or Facebook).
- District must match the selected division.
- Donation dates cannot be in the future.
- New donation records must be later than the last donation date.
- A minimum 2-month interval is enforced between donations.
- Donor search returns only active (`onn`) and currently eligible donors.

## Quality and Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov

# lint + format
npm run lint
npm run format
```

## Deployment Notes

- `TypeOrmModule` is configured with `synchronize: false`, so database schema must exist before deployment.
- Use strong secrets for JWT and SMTP credentials.
- Restrict CORS origin to trusted frontend domains.

