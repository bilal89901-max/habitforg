import { Router } from 'express';
import * as guildController from '../controllers/guildController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, guildController.createGuild);
router.get('/search', authenticate, guildController.searchGuilds);
router.get('/:id', authenticate, guildController.getGuild);
router.post('/:id/join', authenticate, guildController.joinGuild);
router.delete('/:id/leave', authenticate, guildController.leaveGuild);
router.post('/:id/members', authenticate, guildController.manageMembers);
router.post('/:id/challenges', authenticate, guildController.createChallenge);
router.get('/:id/challenges', authenticate, guildController.getGuildChallenges);

export default router;
