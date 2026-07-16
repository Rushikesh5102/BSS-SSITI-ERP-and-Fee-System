import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types/enums';
import { logger } from '../utils/logger';

const router = Router();

// Only DEVELOPER can access these
router.use(authenticate, authorize(Role.DEVELOPER));

/**
 * POST /api/system/lockdown
 * Toggle global lockdown mode
 */
router.post('/lockdown', async (req, res) => {
    const { enabled } = req.body;
    
    await prisma.systemConfig.upsert({
        where: { key: 'LOCKDOWN_MODE' },
        update: { value: String(enabled) },
        create: { key: 'LOCKDOWN_MODE', value: String(enabled) },
    });
    
    logger.warn(`SYSTEM LOCKDOWN ${enabled ? 'ENABLED' : 'DISABLED'} by ${req.user?.email}`);
    
    res.json({ success: true, enabled });
});

/**
 * POST /api/system/deploy
 * Simulate deployment tasks
 */
router.post('/deploy', async (req, res) => {
    const { task } = req.body;
    
    logger.info(`DEPLOYMENT TASK: ${task} started by ${req.user?.email}`);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({ success: true, message: `Deployment task '${task}' completed successfully.` });
});

/**
 * GET /api/system/config
 * Get current system config
 */
router.get('/config', async (req, res) => {
    const configs = await prisma.systemConfig.findMany();
    const configMap = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
    res.json({ success: true, config: configMap });
});

export default router;
