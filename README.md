# BABY Finance

BABY Finance is a small budgeting app built with React, Express, Prisma, and Supabase Postgres.


## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Express
- **Database:** Supabase Postgres

## Features

- Income and Expense planning with categories and spending types
- Calendar view for expected income, expenses, and goals
- Planned vs received/paid tracking
- Monthly budget limits
- Goals tracking and contributions
- Summary dashboard with charts and budgeting insights

## Project Structure

```text
frontend/
  src/
    components/
    context/
    hooks/
    lib/
    pages/
    styles/

backend/
  routes/
  utils/
  index.js
  db.js

prisma/
  schema.prisma
  migrations/
```

## Requirements

Before running the project, make sure you have:

- Node.js 18+
- npm
- a Supabase project with a Postgres database

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create an `.env` file

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="postgresql://YOUR_SUPABASE_CONNECTION_STRING"
PORT=3001
```

Notes:

- `DATABASE_URL` should be your **Supabase session pooler** connection string
- if your database password contains special characters like `@` or `/`, it must be URL-encoded

### 4. Run Prisma migrations

```bash
npx prisma migrate dev
```

### 5. Start the app

Run frontend and backend together:

```bash
npm run dev:fullstack
```

## Local URLs

Once the app is running:

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:3001>
