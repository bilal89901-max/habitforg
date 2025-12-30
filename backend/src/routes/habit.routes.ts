import { Router } from 'express';
import * as habitController from '../controllers/habitController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, habitController.createHabit);
router.get('/', authenticate, habitController.getHabits);
router.put('/:id', authenticate, habitController.updateHabit);
router.delete('/:id', authenticate, habitController.deleteHabit);
router.post('/:id/log', authenticate, habitController.logHabitCompletion);
router.get('/:id/stats', authenticate, habitController.getHabitStats);

export default router;
