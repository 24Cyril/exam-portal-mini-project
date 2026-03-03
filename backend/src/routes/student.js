import express from 'express';
import {
    getMyExams,
    startExam,
    submitResult,
    getAvailableCourses,
    enrollInCourse,
    unenrollFromCourse,
    submitPayment,
    getMyPayments
} from '../controllers/studentController.js';
import { protect, authorize } from '../middlewares/auth.js';

import * as noteController from '../controllers/noteController.js';

const router = express.Router();

// Routes for student dashboard, courses, and exams
router.use(protect);
router.use(authorize('student'));

// Course & Enrollment
router.get('/available-courses', getAvailableCourses);
router.post('/enroll', enrollInCourse);
router.delete('/unenroll/:courseId', unenrollFromCourse);

// Payments
router.post('/pay', submitPayment);
router.post('/submit-payment', submitPayment);
router.get('/my-payments', getMyPayments);

// Materials
router.get('/notes', noteController.getStudentNotes);

// Exams
router.get('/my-exams', getMyExams);
router.post('/start-exam', startExam);
router.post('/submit-result', submitResult);

export default router;
