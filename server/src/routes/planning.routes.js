import { Router } from 'express';
import * as planningController from '../controllers/planningController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/current', planningController.getCurrentPlan);
router.get('/ideas', planningController.listPlanningIdeas);
router.get('/suggest', planningController.suggestIdeas);
router.post('/select', planningController.selectIdea);
router.post('/token', planningController.generateToken);
router.post('/preview-token', planningController.generatePreviewToken);
router.get('/history', planningController.getHistory);
router.post('/:id/done', planningController.markDone);
router.delete('/:id', planningController.cancelPlan); // Add Cancel route

export default router;
