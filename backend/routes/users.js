import { Router } from 'express';
import prisma from '../db.js';
import { parseIntegerParam } from '../utils/request.js';
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

export default router;
