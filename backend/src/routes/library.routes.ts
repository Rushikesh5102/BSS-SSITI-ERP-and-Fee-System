import { Router } from 'express';
import {
    getDashboardStats,
    getBooks,
    createBook,
    updateBook,
    archiveBook,
    issueBook,
    getIssues,
    returnBook,
    overrideFine,
    reserveBook,
    getReservations,
    getMovementHistory
} from '../controllers/library.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Allow authenticated users (and development simulations) to view & operate library routes
router.use(authenticate);

// ── Dashboard Metrics ─────────────────────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);

// ── Book Catalog Routes ───────────────────────────────────────────────────────
router.get('/books', getBooks);
router.post('/books', createBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', archiveBook);

// ── Book Issue Register ───────────────────────────────────────────────────────
router.get('/issues', getIssues);
router.post('/issues', issueBook);

// ── Book Return & Fine Management ─────────────────────────────────────────────
router.post('/returns', returnBook);
router.post('/fines/override', overrideFine);

// ── Reservation System ────────────────────────────────────────────────────────
router.get('/reservations', getReservations);
router.post('/reservations', reserveBook);

// ── Movement History ──────────────────────────────────────────────────────────
router.get('/history', getMovementHistory);

export default router;
