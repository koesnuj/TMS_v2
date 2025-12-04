import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getDashboardStats, getMyAssignments, getRecentActivity, getOverviewStats, getActivePlans } from '../controllers/dashboardController';

const router = express.Router();

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/my-assignments', authenticateToken, getMyAssignments);
router.get('/recent-activity', authenticateToken, getRecentActivity);
router.get('/overview', authenticateToken, getOverviewStats);
router.get('/active-plans', authenticateToken, getActivePlans);

export default router;




