import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import ideasRoutes from './routes/ideas.routes.js';
import planningRoutes from './routes/planning.routes.js';
import receiverRoutes from './routes/receiver.routes.js';
import bingoRoutes from './routes/bingo.routes.js';
import aiRoutes from './routes/ai.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getUploadDir } from './utils/uploads.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = getUploadDir();
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.set('trust proxy', 1); // For rate limiting behind proxies
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for simple SPA serving (avoids Vite inline script issues)
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow loading images from uploads
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(globalLimiter);
app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined'));

// Serve Uploads
app.use('/uploads', express.static(uploadDir));

app.use(session({
  name: 'datebingo_sid',
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // ONLY set secure to true if we are behind an HTTPS proxy. 
    // For direct Docker/local access on HTTP, this MUST be false or the cookie is dropped.
    secure: process.env.NODE_ENV === 'production' && process.env.USE_HTTPS === 'true', 
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/receiver', receiverRoutes); // Public token access
app.use('/api/bingo', bingoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

// Serve Static Frontend (Production)
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
