import { Router } from 'express';
import { storeItemsController } from '../controllers/storeItems.controller';
import { storeSuppliersController } from '../controllers/storeSuppliers.controller';
import { stockTransactionsController } from '../controllers/stockTransactions.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types/enums';

const router = Router();

// Require login for all store routes
router.use(authenticate);

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
router.get('/dashboard-stats', stockTransactionsController.getDashboardStats);

// ─── Store Items / Asset Register Routes ────────────────────────────────────
router.get('/items', storeItemsController.list);
router.get('/items/:id', storeItemsController.getById);
router.post('/items', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), storeItemsController.create);
router.put('/items/:id', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), storeItemsController.update);
router.delete('/items/:id', authorize(Role.STORE_MANAGER, Role.ADMIN), storeItemsController.delete);

// ─── Stock & Asset Movement Transactions Routes ─────────────────────────────
router.get('/transactions', stockTransactionsController.list);
router.post('/transactions/issue', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordIssue);
router.post('/transactions/kit-issue', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordKitIssue);
router.post('/transactions/return', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordReturn);
router.post('/transactions/maintenance', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordMaintenance);
router.post('/transactions/transfer', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordTransfer);
router.post('/transactions/damage', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordDamage);
router.post('/transactions/inward', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordInward);
router.post('/transactions/outward', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordOutward);
router.post('/transactions/adjustment', authorize(Role.STORE_MANAGER, Role.ADMIN, Role.TEACHER), stockTransactionsController.recordAdjustment);

// ─── Legacy Suppliers Routes ──────────────────────────────────────────────────
router.get('/suppliers', storeSuppliersController.list);
router.get('/suppliers/:id', storeSuppliersController.getById);
router.post('/suppliers', authorize(Role.STORE_MANAGER, Role.ADMIN), storeSuppliersController.create);
router.put('/suppliers/:id', authorize(Role.STORE_MANAGER, Role.ADMIN), storeSuppliersController.update);
router.delete('/suppliers/:id', authorize(Role.ADMIN), storeSuppliersController.delete);

export default router;
