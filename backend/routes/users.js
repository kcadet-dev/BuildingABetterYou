import { Router } from 'express';
import prisma from '../db.js';
import { normalizeEmail, parseDateInput, parseIntegerParam } from '../utils/request.js';
import { serializeUser } from '../utils/serializers.js';

const router = Router();

router.get('/:userId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json(serializeUser(user));
});

router.put('/:userId', async (req, res) => {
  const userId = parseIntegerParam(req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: 'A valid user id is required.' });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const trimmedFirstName = String(req.body.firstName || '').trim();
  const trimmedLastName = String(req.body.lastName || '').trim();
  const normalizedEmail = normalizeEmail(req.body.email);
  const parsedDateOfBirth = parseDateInput(req.body.dateOfBirth);

  if (!trimmedFirstName || !trimmedLastName || !normalizedEmail || !req.body.dateOfBirth) {
    return res.status(400).json({
      message: 'First name, last name, date of birth, and email are required.',
    });
  }

  if (!normalizedEmail.includes('@')) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  if (!parsedDateOfBirth || Number.isNaN(parsedDateOfBirth.getTime())) {
    return res.status(400).json({ message: 'Enter a valid date of birth.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      data: {
        dateOfBirth: parsedDateOfBirth,
        email: normalizedEmail,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        username: normalizedEmail,
      },
      where: { id: userId },
    });

    res.json(serializeUser(updatedUser));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'That email is already in use.' });
    }

    res.status(500).json({ message: 'Could not update account details.' });
  }
});

export default router;
