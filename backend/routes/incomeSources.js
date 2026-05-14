import { Router } from 'express';
import prisma from '../db.js';
import { parseIntegerParam } from '../utils/request.js';
import { serializeIncomeSource } from '../utils/serializers.js';
import { buildIncomeSourceData } from '../utils/sourceData.js';

const router = Router();

router.get('/:userId/income-sources', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const incomeSources = await prisma.incomeSource.findMany({
    where: { userId },
    orderBy: { nextPayDate: 'asc' },
  });

  res.json(incomeSources.map(serializeIncomeSource));
});

router.post('/:userId/income-sources', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
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

router.put('/:userId/income-sources/:incomeSourceId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);
  const incomeSourceId = parseIntegerParam(req.params.incomeSourceId);

  if (!userId || !incomeSourceId) {
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

router.delete('/:userId/income-sources/:incomeSourceId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);
  const incomeSourceId = parseIntegerParam(req.params.incomeSourceId);

  if (!userId || !incomeSourceId) {
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

  await prisma.incomeSource.delete({
    where: { id: incomeSourceId },
  });

  res.status(204).send();
});

export default router;
