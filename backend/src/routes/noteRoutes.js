import express from 'express';
import * as noteController from '../controllers/noteController.js';
import { verifyToken, isAdmin, isTeacher } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/my-notes', verifyToken, noteController.getStudentNotes);
router.get('/course/:courseId', verifyToken, noteController.getNotesByCourse);
router.post('/add', verifyToken, isTeacher, noteController.addNote);

export default router;
