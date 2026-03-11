import express from 'express';
import { createUserProfile, getUserProfile, updateUserProfile } from '../controllers/adminController.js';

const router = express.Router();

// Route to initialize user from Firebase after sign-up on frontend
router.post('/sync-profile', createUserProfile);

// Route to get a specific user's public profile
router.get('/profile/:uid', getUserProfile);

// Route to update profile details
router.patch('/profile/:uid', updateUserProfile);

export default router;
