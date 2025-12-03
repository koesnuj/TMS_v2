import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  createPlan, 
  getPlans, 
  getPlanDetail,
  updatePlan,
  updatePlanItem, 
  bulkUpdatePlanItems,
  archivePlan,
  unarchivePlan,
  deletePlan,
  bulkArchivePlans,
  bulkUnarchivePlans,
  bulkDeletePlans
} from '../controllers/planController';

const router = express.Router();

router.get('/', authenticateToken, getPlans);
router.post('/', authenticateToken, createPlan);

// Bulk operations (must be before parameterized routes)
router.patch('/bulk/archive', authenticateToken, bulkArchivePlans);
router.patch('/bulk/unarchive', authenticateToken, bulkUnarchivePlans);
router.delete('/bulk', authenticateToken, bulkDeletePlans);

router.get('/:planId', authenticateToken, getPlanDetail);
router.patch('/:planId', authenticateToken, updatePlan);
router.delete('/:planId', authenticateToken, deletePlan);

// Plan status updates
router.patch('/:planId/archive', authenticateToken, archivePlan);
router.patch('/:planId/unarchive', authenticateToken, unarchivePlan);

// Plan Item updates
router.patch('/:planId/items/bulk', authenticateToken, bulkUpdatePlanItems); // Specific route before parameterized route
router.patch('/:planId/items/:itemId', authenticateToken, updatePlanItem);

export default router;

