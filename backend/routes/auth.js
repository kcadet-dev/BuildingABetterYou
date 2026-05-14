import { Router } from 'express';
import prisma from '../db.js';
import { hashPassword, verifyPassword } from '../password.js';
import { normalizeEmail, parseDateInput } from '../utils/request.js';
import { serializeUser } from '../utils/serializers.js';

const router = Router();

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) => {
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

export default router;
