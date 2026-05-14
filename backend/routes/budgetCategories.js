import { Router } from 'express';
import prisma from '../db.js';
import { parseIntegerParam } from '../utils/request.js';
import { serializeBudgetCategory } from '../utils/serializers.js';
import { buildBudgetCategoryData } from '../utils/sourceData.js';

const router = Router();

router.get('/:userId/budget-categories', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const budgetCategories = await prisma.budgetCategory.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });

  res.json(budgetCategories.map(serializeBudgetCategory));
});

router.post('/:userId/budget-categories', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const payload = buildBudgetCategoryData(req.body, userId);

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const existingCategory = await prisma.budgetCategory.findFirst({
    where: {
      name: payload.data.name,
      userId,
    },
  });

  const budgetCategory = existingCategory
    ? await prisma.budgetCategory.update({
        data: payload.data,
        where: { id: existingCategory.id },
      })
    : await prisma.budgetCategory.create({
        data: payload.data,
      });

  res.status(existingCategory ? 200 : 201).json(serializeBudgetCategory(budgetCategory));
});

router.put('/:userId/budget-categories/:budgetCategoryId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);
  const budgetCategoryId = parseIntegerParam(req.params.budgetCategoryId);

  if (!userId || !budgetCategoryId) {
    return res.status(400).json({ message: 'Valid ids are required.' });
  }

  const existingCategory = await prisma.budgetCategory.findFirst({
    where: {
      id: budgetCategoryId,
      userId,
    },
  });

  if (!existingCategory) {
    return res.status(404).json({ message: 'Budget category not found.' });
  }

  const payload = buildBudgetCategoryData(req.body, userId);

  if (payload.error) {
    return res.status(400).json({ message: payload.error });
  }

  const budgetCategory = await prisma.budgetCategory.update({
    data: payload.data,
    where: { id: budgetCategoryId },
  });

  res.json(serializeBudgetCategory(budgetCategory));
});

router.delete('/:userId/budget-categories/:budgetCategoryId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);
  const budgetCategoryId = parseIntegerParam(req.params.budgetCategoryId);

  if (!userId || !budgetCategoryId) {
    return res.status(400).json({ message: 'Valid ids are required.' });
  }

  const existingCategory = await prisma.budgetCategory.findFirst({
    where: {
      id: budgetCategoryId,
      userId,
    },
  });

  if (!existingCategory) {
    return res.status(404).json({ message: 'Budget category not found.' });
  }

  await prisma.budgetCategory.delete({
    where: { id: budgetCategoryId },
  });

  res.status(204).send();
});

export default router;
