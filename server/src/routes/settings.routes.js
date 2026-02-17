import { Router } from 'express';

import * as settingsController from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.get('/ai', settingsController.getAiSettings);
router.put('/ai', settingsController.updateAiSettings);
router.post('/ai/test', aiLimiter, settingsController.testAiSettings);

export default router;
