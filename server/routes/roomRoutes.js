import express from 'express';
import {
  createRoom,
  getRoom,
  updateRoomProblem,
  updateRoomCode,
  submitSolution,
  saveFeedback,
  getMyRooms,
  getPresets,
} from '../controllers/roomController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Optional Auth routes
router.post('/create', optionalProtect, createRoom);
router.get('/presets', getPresets);

// Protected routes
router.get('/my/active', protect, getMyRooms);

// Specific room routes
router.get('/:roomId', getRoom);
router.put('/:roomId/problem', updateRoomProblem);
router.put('/:roomId/code', updateRoomCode);
router.post('/:roomId/submit', submitSolution);
router.put('/:roomId/feedback', saveFeedback);

export default router;

