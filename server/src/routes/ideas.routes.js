import fs from 'fs';
import path from 'path';

import { Router } from 'express';
import multer from 'multer';

import * as ideasController from '../controllers/ideasController.js';
import { requireAuth } from '../middleware/auth.js';
import { getUploadDir } from '../utils/uploads.js';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = getUploadDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.use(requireAuth);
router.get('/', ideasController.listIdeas);
router.get('/:id/media', ideasController.listIdeaMedia);
router.get('/:id/media/auto-prompt', ideasController.getIdeaAutoPrompt);
router.post('/:id/media/generate', ideasController.generateIdeaMedia);
router.post('/:id/media/select', ideasController.selectIdeaMedia);
router.post('/:id/prep/generate/plan-a', ideasController.generateIdeaPlanAPrep);
router.post('/:id/prep/generate/plan-b', ideasController.generateIdeaPlanBPrep);
router.post('/', upload.single('image'), ideasController.createIdea); // Add upload middleware
router.put('/:id', upload.single('image'), ideasController.updateIdea); // Add upload middleware
router.delete('/:id', ideasController.deleteIdea);

export default router;
