import { Router } from 'express';
import * as avatarController from '../controllers/avatarController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, avatarController.getUserAvatar);
router.get('/:id', authenticate, avatarController.getAvatar);
router.put('/:id', authenticate, avatarController.updateAvatar);
router.get('/:id/evolution-status', authenticate, avatarController.getEvolutionStatus);

export default router;
