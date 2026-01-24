import { Router } from 'express';
import * as ideasController from '../controllers/ideasController.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data/uploads'); // Use process.cwd() for reliable path in Docker
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
router.post('/', upload.single('image'), ideasController.createIdea); // Add upload middleware
router.put('/:id', upload.single('image'), ideasController.updateIdea); // Add upload middleware
router.delete('/:id', ideasController.deleteIdea);

export default router;
