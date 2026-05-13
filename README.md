# Baby Finance

**Building a Better You**

Baby Finance is a starter template for a small budgeting app. The goal is to
learn fullstack development in small commits instead of building the whole final
project in one rush.

## Project Shape

- React frontend with Vite
- Login/signup screen and starter home dashboard
- Express backend with starter API routes
- Prisma schema connected to a SQLite database
- Basic username/password account routes
- Starter CRUD route names for budget categories

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

- Add a signup/login form in React
- Store the logged-in user in React state
- Add sessions or JWT auth
- Connect the React budget list to `GET /api/budgets`
- Add a form for creating a budget category
- Use Prisma in the backend routes
- Add expense tracking
- Add edit and delete buttons
- Add simple validation and helpful error messages

## Starter Account Routes

Create an account:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"secret123"}'
```

Log in:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"secret123"}'
```
