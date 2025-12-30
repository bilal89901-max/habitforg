import { Router } from 'express';
import * as shopController from '../controllers/shopController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, shopController.getShopItems);
router.post('/:item_id/purchase', authenticate, shopController.purchaseItem);
router.get('/inventory', authenticate, shopController.getInventory);
router.post('/inventory/:item_id/equip', authenticate, shopController.equipItem);
router.post('/inventory/:item_id/unequip', authenticate, shopController.unequipItem);

export default router;
