import { Router, Request, Response } from 'express';
import { signup, login, getMe, logout } from '../controllers/auth.controller.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Wrapper to handle AuthRequest type
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  return getMe(req as AuthRequest, res);
});

export default router;
