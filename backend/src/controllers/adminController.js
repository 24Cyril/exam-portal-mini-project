import { db, auth } from '../config/firebase.js';

// --- USER MANAGEMENT ---

// Sync Firebase Auth user to Firestore (Initial creation)
export const createUserProfile = async (req, res) => {
    try {
        const { uid, role, ...profileData } = req.body;
        const userRef = db.collection('users').doc(uid);
        const userExists = (await userRef.get()).exists;

        if (userExists) {
            return res.status(200).json({ status: 'Profile already exists' });
        }

        // Set custom claims for role-based auth
        await auth.setCustomUserClaims(uid, { role });

        const userData = {
            ...profileData,
            role: role || 'student',
            status: 'Active',
            createdAt: new Date().toISOString(),
        };

        await userRef.set(userData);
        res.status(201).json({ uid, ...userData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single user profile
export const getUserProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(userDoc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all users with filtering by role
export const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = db.collection('users');

        if (role) {
            query = query.where('role', '==', role);
        }

        const snapshot = await query.get();
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a user (from both Auth and Firestore)
export const deleteUser = async (req, res) => {
    try {
        const { uid } = req.params;
        await auth.deleteUser(uid);
        await db.collection('users').doc(uid).delete();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { uid, newRole } = req.body;
        await auth.setCustomUserClaims(uid, { role: newRole });
        await db.collection('users').doc(uid).update({ role: newRole });
        res.status(200).json({ status: 'User role updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- COURSE MANAGEMENT ---

// Create a new course
export const createCourse = async (req, res) => {
    try {
        const { name, code, department, description, duration, fee } = req.body;
        const courseData = {
            name,
            code,
            department,
            description,
            duration,
            fee,
            status: 'Active',
            createdBy: req.user.uid,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('courses').add(courseData);
        res.status(201).json({ id: docRef.id, ...courseData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all courses
export const getAllCourses = async (req, res) => {
    try {
        const snapshot = await db.collection('courses').get();
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a course
export const deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        await db.collection('courses').doc(courseId).delete();
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
