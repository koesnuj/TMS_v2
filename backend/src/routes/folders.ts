import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createFolder, getFolderTree, getTestCasesByFolder } from '../controllers/folderController';

const router = express.Router();

router.get('/tree', authenticateToken, getFolderTree);
router.post('/', authenticateToken, createFolder);
router.get('/:folderId/testcases', authenticateToken, getTestCasesByFolder);

export default router;

