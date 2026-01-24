import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);
router.post('/update-password', requireAuth, authController.updatePassword);

export default router;
