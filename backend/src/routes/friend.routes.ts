import { Router } from 'express';
import * as friendController from '../controllers/friendController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, friendController.getFriends);
router.get('/requests', authenticate, friendController.getFriendRequests);
router.get('/activity', authenticate, friendController.getFriendActivity);
router.post('/:id/request', authenticate, friendController.sendFriendRequest);
router.post('/:id/accept', authenticate, friendController.acceptFriendRequest);
router.delete('/:id', authenticate, friendController.removeFriend);
router.get('/:id/compare', authenticate, friendController.compareFriend);

export default router;
