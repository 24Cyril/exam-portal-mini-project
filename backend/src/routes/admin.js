import express from 'express';
import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    createCourse,
    getAllCourses,
    deleteCourse,
    getAllEnrollments,
    updateEnrollmentStatus,
    getAllPayments,
    updatePaymentStatus
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Role-based protection
router.use(protect);
router.use(authorize('admin'));

// User Management
router.get('/users', getAllUsers);
router.put('/update-role', updateUserRole);
router.delete('/user/:uid', deleteUser);

// Course Management
router.post('/courses', createCourse);
router.get('/courses', getAllCourses);
router.delete('/course/:courseId', deleteCourse);

// Enrollment Management
router.get('/enrollments', getAllEnrollments);
router.patch('/enrollment/:enrollmentId', updateEnrollmentStatus);

// Payment Management
router.get('/payments', getAllPayments);
router.patch('/payment/:paymentId', updatePaymentStatus);

export default router;
