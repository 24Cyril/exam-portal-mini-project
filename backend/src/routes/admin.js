import express from 'express';
import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    createCourse,
    getAllCourses,
    deleteCourse
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

export default router;
