# BABY Finance

**Building a Better You**

BABY Finance is a small budgeting app project for learning fullstack development
in focused commits. It tracks planned income, expenses, goals, monthly limits,
and simple planned-vs-actual confirmations.

## Project Shape

- `frontend/` contains the React and Vite app
- `backend/` contains the Express API
- `prisma/` contains the SQLite database schema and migrations
- React pages are split into readable screen components
- Backend routes are split by feature
- Prisma schema connected to a SQLite database
- Email/password account routes
- CRUD routes for income sources, expense sources, and monthly budget limits

## Folder Guide

```text
frontend/
  index.html
  src/
    App.jsx
    components/
    context/
    hooks/
    lib/
    pages/
    styles/

backend/
  index.js
  routes/
  utils/

prisma/
  schema.prisma
  migrations/
```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example:

   ```bash
   cp .env.example .env
   ```

3. Generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Run the frontend and backend together:

   ```bash
   npm run dev:fullstack
   ```

5. Open the app in your browser:

   - Frontend: <http://localhost:5173>
   - Backend health check: <http://localhost:3001/api/health>

## Ideas For Future Commits

- Move goals and confirmations from localStorage into Prisma
- Add planned-vs-actual transaction records
- Add sessions or JWT auth later
- Add automated tests for backend routes
- Break larger summary/planner feature files into even smaller components as features grow

## Starter Account Routes

Create an account:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Demo","lastName":"User","dateOfBirth":"2005-05-13","email":"demo@example.com","password":"secret123"}'
```

Log in:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"secret123"}'
```
