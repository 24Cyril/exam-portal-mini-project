// backend/src/routes/teacher.js
import express from 'express';
import { getTeacherDashboard, createExam, getExams } from '../controllers/teacherController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Protect all teacher routes and ensure role is teacher
router.use(protect);
router.use(authorize('teacher'));

router.get('/dashboard', getTeacherDashboard);
router.post('/exams', createExam);
router.get('/exams', getExams);

export default router;
