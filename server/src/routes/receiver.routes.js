import { Router } from 'express';
import * as receiverController from '../controllers/receiverController.js';
import { receiverLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply stricter rate limit
router.use(receiverLimiter);
router.get('/', receiverController.viewDate);
router.post('/veto', receiverController.vetoDate);

export default router;
