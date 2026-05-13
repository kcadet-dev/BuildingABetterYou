import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import prisma from './db.js';
import { hashPassword, verifyPassword } from './password.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function parseDateInput(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = String(dateValue).split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 12);
}

function serializeUser(user) {
  return {
    createdAt: user.createdAt,
    email: user.email,
    firstName: user.firstName,
    id: user.id,
    lastName: user.lastName,
  };
}

function serializeIncomeSource(incomeSource) {
  return {
    ...incomeSource,
    amount: Number(incomeSource.amount),
    compensationType: incomeSource.compensationType,
    estimatedTaxRate:
      incomeSource.estimatedTaxRate === null ? null : Number(incomeSource.estimatedTaxRate),
    grossAmount: incomeSource.grossAmount === null ? null : Number(incomeSource.grossAmount),
    hourlyRate: incomeSource.hourlyRate === null ? null : Number(incomeSource.hourlyRate),
    hoursPerPeriod:
      incomeSource.hoursPerPeriod === null ? null : Number(incomeSource.hoursPerPeriod),
    name: incomeSource.jobName,
  };
}

function buildIncomeSourceData(payload, userId) {
  const {
    amount,
    compensationType,
    estimatedTaxRate,
    frequency,
    grossAmount,
    hourlyRate,
    hoursPerPeriod,
    jobName,
    name,
    nextPayDate,
  } = payload;
  const sourceName = String(name || jobName || '').trim();
  const incomeAmount = Number(amount);
  const parsedGrossAmount =
    grossAmount === '' || grossAmount === null || grossAmount === undefined ? null : Number(grossAmount);
  const parsedTaxRate =
    estimatedTaxRate === '' || estimatedTaxRate === null || estimatedTaxRate === undefined
      ? null
      : Number(estimatedTaxRate);
  const parsedHourlyRate =
    hourlyRate === '' || hourlyRate === null || hourlyRate === undefined ? null : Number(hourlyRate);
  const parsedHoursPerPeriod =
    hoursPerPeriod === '' || hoursPerPeriod === null || hoursPerPeriod === undefined
      ? null
      : Number(hoursPerPeriod);
  const normalizedCompensationType =
    compensationType === 'hourly' || compensationType === 'salaried' ? compensationType : null;

  if (!sourceName || !frequency || !nextPayDate) {
    return { error: 'Income source name, frequency, and first income date are required.' };
  }

  if (Number.isNaN(incomeAmount) || incomeAmount <= 0) {
    return { error: 'Income amount must be greater than 0.' };
  }

  if (
    normalizedCompensationType === 'salaried' &&
    (parsedGrossAmount === null || Number.isNaN(parsedGrossAmount) || parsedGrossAmount <= 0)
  ) {
    return { error: 'Gross salaried pay must be greater than 0.' };
  }

  if (
    normalizedCompensationType === 'hourly' &&
    ((parsedHourlyRate === null || parsedHourlyRate <= 0) ||
      (parsedHoursPerPeriod === null || parsedHoursPerPeriod <= 0))
  ) {
    return { error: 'Hourly rate and hours per pay period must be greater than 0.' };
  }

  if (parsedTaxRate !== null && (Number.isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100)) {
    return { error: 'Estimated tax rate must be between 0 and 100.' };
  }

  return {
    data: {
      amount: incomeAmount,
      compensationType: normalizedCompensationType,
      estimatedTaxRate: parsedTaxRate,
      frequency,
      grossAmount:
        normalizedCompensationType === null
          ? null
          : normalizedCompensationType === 'salaried'
            ? parsedGrossAmount
            : parsedHourlyRate * parsedHoursPerPeriod,
      hourlyRate: normalizedCompensationType === 'hourly' ? parsedHourlyRate : null,
      hoursPerPeriod: normalizedCompensationType === 'hourly' ? parsedHoursPerPeriod : null,
      isCash: false,
      jobName: sourceName,
      nextPayDate: new Date(nextPayDate),
      userId,
    },
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'BABY Finance' });
});

app.post('/api/auth/register', async (req, res) => {
  const { dateOfBirth, email, firstName, lastName, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const trimmedFirstName = String(firstName || '').trim();
  const trimmedLastName = String(lastName || '').trim();
  const parsedDateOfBirth = parseDateInput(dateOfBirth);

  if (!trimmedFirstName || !trimmedLastName || !normalizedEmail || !dateOfBirth || !password) {
    return res.status(400).json({
      message: 'First name, last name, date of birth, email, and password are required.',
    });
  }

  if (!normalizedEmail.includes('@')) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  if (!parsedDateOfBirth || Number.isNaN(parsedDateOfBirth.getTime())) {
    return res.status(400).json({ message: 'Enter a valid date of birth.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        dateOfBirth: parsedDateOfBirth,
        email: normalizedEmail,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        passwordHash,
        username: normalizedEmail,
      },
    });

    res.status(201).json(serializeUser(user));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'That email is already in use.' });
    }

    res.status(500).json({ message: 'Could not create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username: normalizedEmail }],
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.json(serializeUser(user));
});

app.get('/api/users/:userId/income-sources', async (req, res) => {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const incomeSources = await prisma.incomeSource.findMany({
    where: { userId },
    orderBy: { nextPayDate: 'asc' },
  });

  res.json(incomeSources.map(serializeIncomeSource));
});

app.post('/api/users/:userId/income-sources', async (req, res) => {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const payload = buildIncomeSourceData(req.body, userId);

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const incomeSource = await prisma.incomeSource.create({
    data: payload.data,
  });

  res.status(201).json(serializeIncomeSource(incomeSource));
});

app.put('/api/users/:userId/income-sources/:incomeSourceId', async (req, res) => {
  const userId = Number(req.params.userId);
  const incomeSourceId = Number(req.params.incomeSourceId);

  if (!Number.isInteger(userId) || !Number.isInteger(incomeSourceId)) {
    return res.status(400).json({ message: 'Valid ids are required.' });
  }

  const existingIncomeSource = await prisma.incomeSource.findFirst({
    where: {
      id: incomeSourceId,
      userId,
    },
  });

  if (!existingIncomeSource) {
    return res.status(404).json({ message: 'Income source not found.' });
  }

  const payload = buildIncomeSourceData(req.body, userId);

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const updatedIncomeSource = await prisma.incomeSource.update({
    data: payload.data,
    where: { id: incomeSourceId },
  });

  res.json(serializeIncomeSource(updatedIncomeSource));
});

app.get('/api/budgets', (req, res) => {
  // TODO: Replace this with Prisma once your database is connected.
  res.json([
    { id: 1, name: 'Groceries', limit: 300, spent: 120 },
    { id: 2, name: 'Savings', limit: 200, spent: 75 },
  ]);
});

app.post('/api/budgets', (req, res) => {
  // TODO: Validate req.body, then create a budget category in the database.
  res.status(201).json({ message: 'Create budget route placeholder' });
});

app.put('/api/budgets/:id', (req, res) => {
  // TODO: Update a budget category by id.
  res.json({ message: `Update budget ${req.params.id} route placeholder` });
});

app.delete('/api/budgets/:id', (req, res) => {
  // TODO: Delete a budget category by id.
  res.json({ message: `Delete budget ${req.params.id} route placeholder` });
});

app.listen(port, () => {
  console.log(`BABY Finance API running on http://localhost:${port}`);
});
