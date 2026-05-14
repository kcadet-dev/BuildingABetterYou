import { Router } from 'express';
import prisma from '../db.js';
import { parseIntegerParam } from '../utils/request.js';
import { serializeExpenseSource } from '../utils/serializers.js';
import { buildExpenseSourceData } from '../utils/sourceData.js';

const router = Router();

router.get('/:userId/expense-sources', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const expenseSources = await prisma.expenseSource.findMany({
    where: { userId },
    orderBy: { nextDueDate: 'asc' },
  });

  res.json(expenseSources.map(serializeExpenseSource));
});

router.post('/:userId/expense-sources', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const payload = buildExpenseSourceData(req.body, userId);

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const expenseSource = await prisma.expenseSource.create({
    data: payload.data,
  });

  res.status(201).json(serializeExpenseSource(expenseSource));
});

router.put('/:userId/expense-sources/:expenseSourceId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);
  const expenseSourceId = parseIntegerParam(req.params.expenseSourceId);

  if (!userId || !expenseSourceId) {
    return res.status(400).json({ message: 'Valid ids are required.' });
  }

  const existingExpenseSource = await prisma.expenseSource.findFirst({
    where: {
      id: expenseSourceId,
      userId,
    },
  });

  if (!existingExpenseSource) {
    return res.status(404).json({ message: 'Expense source not found.' });
  }

  const payload = buildExpenseSourceData(req.body, userId);

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const updatedExpenseSource = await prisma.expenseSource.update({
    data: payload.data,
    where: { id: expenseSourceId },
  });

  res.json(serializeExpenseSource(updatedExpenseSource));
});

router.delete('/:userId/expense-sources/:expenseSourceId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);
  const expenseSourceId = parseIntegerParam(req.params.expenseSourceId);

  if (!userId || !expenseSourceId) {
    return res.status(400).json({ message: 'Valid ids are required.' });
  }

  const existingExpenseSource = await prisma.expenseSource.findFirst({
    where: {
      id: expenseSourceId,
      userId,
    },
  });

  if (!existingExpenseSource) {
    return res.status(404).json({ message: 'Expense source not found.' });
  }

  await prisma.expenseSource.delete({
    where: { id: expenseSourceId },
  });

  res.status(204).send();
});

export default router;
