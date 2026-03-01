import express from 'express';
import {
    getTeacherDashboard,
    createExam,
    getExams,
    getPendingEnrollments,
    verifyEnrollment,
    getPendingPayments,
    verifyPayment
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

export default router;
