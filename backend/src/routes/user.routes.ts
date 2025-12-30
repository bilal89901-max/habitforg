import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:id', authenticate, userController.getUser);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);
router.get('/:id/stats', authenticate, userController.getUserStats);

export default router;
