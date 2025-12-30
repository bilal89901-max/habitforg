import { Router } from 'express';
import * as battleController from '../controllers/battleController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, battleController.initiateBattle);
router.get('/history', authenticate, battleController.getBattleHistory);
router.get('/opponents', authenticate, battleController.getRandomOpponent);
router.get('/:id', authenticate, battleController.getBattle);

export default router;
