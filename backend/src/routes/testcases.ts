import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { createTestCase, getTestCases, importTestCases } from '../controllers/testcaseController';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/', authenticateToken, getTestCases);
router.post('/', authenticateToken, createTestCase);
router.post('/import', authenticateToken, upload.single('file'), importTestCases);

export default router;

