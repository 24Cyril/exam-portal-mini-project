import express from 'express';
import {
    getTeacherDashboard,
    createExam,
    getExams,
    getPendingEnrollments,
    verifyEnrollment,
    getPendingPayments,
    verifyPayment,
    getPerformance,
    getCoursesByDept,
    getStudentsByDept,
    getAllExamsForDept,
    createCourseByTeacher
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Role-based protection
router.use(protect);
router.use(authorize('teacher'));

router.get('/dashboard', getTeacherDashboard);

// Verification Workflow
router.get('/pending-enrollments', getPendingEnrollments);
router.patch('/verify-enrollment/:enrollmentId', verifyEnrollment);
router.get('/pending-payments', getPendingPayments);
router.patch('/verify-payment/:paymentId', verifyPayment);

// Exams
router.post('/exams', createExam);
router.get('/exams', getExams);
router.get('/all-exams', getAllExamsForDept);

// Courses (teacher-scoped)
router.get('/courses', getCoursesByDept);
router.post('/courses', createCourseByTeacher);

// Students (teacher-scoped)
router.get('/students', getStudentsByDept);

// Performance
router.get('/performance', getPerformance);

export default router;
