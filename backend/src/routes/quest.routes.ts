import { Router } from 'express';
import * as questController from '../controllers/questController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, questController.getQuests);
router.get('/daily', authenticate, questController.getDailyQuests);
router.get('/weekly', authenticate, questController.getWeeklyQuests);
router.get('/epic', authenticate, questController.getEpicQuests);
router.post('/:id/complete', authenticate, questController.completeQuest);
router.post('/:id/start', authenticate, questController.startEpicQuest);

export default router;
