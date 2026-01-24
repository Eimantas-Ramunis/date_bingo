import { rateLimit } from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_PER_MIN) || 60,
  message: { error: 'Too many requests' }
});

export const receiverLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_RECEIVER_PER_MIN) || 20,
  message: { error: 'Slow down' }
});

export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AI_PER_MIN) || 10,
  message: { error: 'AI rate limit exceeded' }
});
