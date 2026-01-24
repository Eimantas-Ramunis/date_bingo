import { Router } from 'express';
import * as bingoController from '../controllers/bingoController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', bingoController.getBingoState);
router.post('/reset', bingoController.resetBingo);

export default router;
