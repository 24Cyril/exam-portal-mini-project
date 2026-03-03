import { db, auth } from '../config/firebase.js';
import { USER_SCHEMA, COURSE_SCHEMA, ENROLLMENT_SCHEMA, PAYMENT_SCHEMA, applySchema } from '../utils/schema.js';

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

        // Merge with full schema to ensure no missing fields
        const userData = applySchema(USER_SCHEMA, {
            ...profileData,
            uid,
            role: role || 'student',
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await userRef.set(userData);
        res.status(201).json(userData);
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

        // Return merged data to prevent undefined frontend errors
        const userData = applySchema(USER_SCHEMA, userDoc.data());
        res.status(200).json(userData);
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
        const users = snapshot.docs.map(doc => applySchema(USER_SCHEMA, { uid: doc.id, ...doc.data() }));
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
        await db.collection('users').doc(uid).update({
            role: newRole,
            updatedAt: new Date().toISOString()
        });
        res.status(200).json({ status: 'User role updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const profileData = req.body;

        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'User not found' });

        // Update with new data and new timestamp
        const updatedData = {
            ...profileData,
            updatedAt: new Date().toISOString()
        };

        await userRef.update(updatedData);
        res.status(200).json({ message: 'Profile updated', data: updatedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- COURSE MANAGEMENT ---

// Create a new course
export const createCourse = async (req, res) => {
    try {
        const courseData = applySchema(COURSE_SCHEMA, {
            ...req.body,
            createdBy: req.user.uid,
            createdAt: new Date().toISOString()
        });

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
        const courses = snapshot.docs.map(doc => applySchema(COURSE_SCHEMA, { id: doc.id, ...doc.data() }));
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

// --- ENROLLMENT MANAGEMENT ---

// Get all enrollment requests
export const getAllEnrollments = async (req, res) => {
    try {
        const snapshot = await db.collection('student_courses').get();
        const enrollments = snapshot.docs.map(doc => applySchema(ENROLLMENT_SCHEMA, { id: doc.id, ...doc.data() }));
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update enrollment status (Verify/Reject)
export const updateEnrollmentStatus = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { status } = req.body; // Verified_Pending_Payment, Rejected, etc.

        await db.collection('student_courses').doc(enrollmentId).update({
            status,
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ message: `Enrollment status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- PAYMENT MANAGEMENT ---

// Get all payments for verification
export const getAllPayments = async (req, res) => {
    try {
        const snapshot = await db.collection('payments').get();
        const payments = snapshot.docs.map(doc => applySchema(PAYMENT_SCHEMA, { id: doc.id, ...doc.data() }));
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify/Reject a payment
export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status, rejectionReason } = req.body;

        const updateData = {
            status,
            updatedAt: new Date().toISOString()
        };

        if (status === 'Verified') {
            updateData.verifiedAt = new Date().toISOString();
        } else if (status === 'Rejected') {
            updateData.rejectionReason = rejectionReason || 'Invalid details';
        }

        await db.collection('payments').doc(paymentId).update(updateData);
        res.status(200).json({ message: `Payment ${status.toLowerCase()} successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
