import { Router } from 'express';
import * as applicationController from '../controllers/applicationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.post('/', asyncHandler(applicationController.createApplication));
router.get('/', asyncHandler(applicationController.listApplications));
router.patch('/:id', asyncHandler(applicationController.updateApplication));
router.delete('/:id', asyncHandler(applicationController.deleteApplication));
router.get('/analytics', asyncHandler(applicationController.analytics));
router.get('/admin/users', requireRole('ADMIN'), asyncHandler(applicationController.adminUsers));

export default router;
