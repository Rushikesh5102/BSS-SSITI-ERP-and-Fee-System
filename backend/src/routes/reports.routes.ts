import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { authenticate, authorize } from '../middleware/auth';

import { Role } from '../types/enums';


const router = Router();

router.use(authenticate);

// GET /reports/dashboard - Dashboard stats
router.get('/dashboard', reportsController.dashboard);

// GET /reports/daily - Daily collection report
router.get('/daily', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT), reportsController.daily);

// GET /reports/monthly - Monthly collection report
router.get('/monthly', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT), reportsController.monthly);

// GET /reports/yearly - Annual collection report
router.get('/yearly', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT), reportsController.yearly);

// GET /reports/pending - Outstanding fees report
router.get('/pending', authorize(Role.SUPERADMIN, Role.ADMIN, Role.ACCOUNTANT), reportsController.pending);

// GET /reports/storage-stats - Database & File Storage usage stats
router.get('/storage-stats', authorize(Role.SUPERADMIN, Role.ADMIN, Role.DEVELOPER), reportsController.storageStats);

// POST /reports/purge-old-data - Free up storage by purging old logs/receipts (DEVELOPER only)
router.post('/purge-old-data', authorize(Role.DEVELOPER), reportsController.purgeOldData);

export default router;
