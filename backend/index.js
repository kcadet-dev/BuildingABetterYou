import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import budgetCategoryRoutes from './routes/budgetCategories.js';
import expenseSourceRoutes from './routes/expenseSources.js';
import incomeSourceRoutes from './routes/incomeSources.js';
import userRoutes from './routes/users.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BABY Finance' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', incomeSourceRoutes);
app.use('/api/users', expenseSourceRoutes);
app.use('/api/users', budgetCategoryRoutes);

app.listen(port, () => {
  console.log(`BABY Finance API running on http://localhost:${port}`);
});
