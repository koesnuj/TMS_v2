import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import { createTestCase, getTestCases, importTestCases, updateTestCase, deleteTestCase } from '../controllers/testcaseController';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/', authenticateToken, getTestCases);
router.post('/', authenticateToken, createTestCase);
router.patch('/:id', authenticateToken, updateTestCase);
router.delete('/:id', authenticateToken, deleteTestCase);
router.post('/import', authenticateToken, upload.single('file'), importTestCases);

export default router;




