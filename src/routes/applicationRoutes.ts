import { Router } from 'express';
import * as applicationController from '../controllers/applicationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', applicationController.createApplication);
router.get('/', applicationController.listApplications);
router.get('/analytics', applicationController.analytics);
router.get('/admin/users', requireRole('ADMIN'), applicationController.adminUsers);

export default router;
