import express from 'express';
import * as noteController from '../controllers/noteController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/my-notes', protect, noteController.getStudentNotes);
router.get('/course/:courseId', protect, noteController.getNotesByCourse);
router.post('/add', protect, authorize('teacher'), noteController.addNote);

export default router;
