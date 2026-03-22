import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);

export default router;
