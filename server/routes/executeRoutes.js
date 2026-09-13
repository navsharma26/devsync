import express from 'express';
import rateLimit from 'express-rate-limit';
import { executeCode } from '../controllers/executeController.js';

const router = express.Router();

// Rate limiting: Max 15 executions per minute per IP to prevent abuse
const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Execution rate limit exceeded. You can only run code 15 times per minute. Please wait a moment.',
  },
});

router.post('/', executionLimiter, executeCode);

export default router;
