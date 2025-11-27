import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createPlan, getPlans, getPlanDetail, updatePlanItem, bulkUpdatePlanItems } from '../controllers/planController';

const router = express.Router();

router.get('/', authenticateToken, getPlans);
router.post('/', authenticateToken, createPlan);
router.get('/:planId', authenticateToken, getPlanDetail);

// Plan Item updates
router.patch('/:planId/items/bulk', authenticateToken, bulkUpdatePlanItems); // Specific route before parameterized route
router.patch('/:planId/items/:itemId', authenticateToken, updatePlanItem);

export default router;

