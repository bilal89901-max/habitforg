import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/habits', authenticate, analyticsController.getHabitAnalytics);
router.get('/avatar', authenticate, analyticsController.getAvatarAnalytics);
router.get('/leaderboards', authenticate, analyticsController.getLeaderboards);
router.get('/prediction', authenticate, analyticsController.getPrediction);
router.get('/comparison', authenticate, analyticsController.getUserComparison);

export default router;
