import { db } from '../config/firebase.js';
import {
    USER_SCHEMA,
    COURSE_SCHEMA,
    ENROLLMENT_SCHEMA,
    PAYMENT_SCHEMA,
    EXAM_SCHEMA,
    applySchema
} from '../utils/schema.js';

// Get current teacher's profile and dashboard details
export const getTeacherDashboard = async (req, res) => {
    try {
        const teacherDoc = await db.collection('users').doc(req.user.uid).get();
        if (!teacherDoc.exists) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }
        res.status(200).json(applySchema(USER_SCHEMA, teacherDoc.data()));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ENROLLMENTS & PAYMENTS (Verification) ---

// Get all pending enrollments for teacher's department
export const getPendingEnrollments = async (req, res) => {
    try {
        const teacherDoc = await db.collection('users').doc(req.user.uid).get();
        const deptId = teacherDoc.data().department_id;

        const enrollmentsSnapshot = await db.collection('student_courses')
            .where('status', '==', 'Pending')
            .get();

        const enrollments = [];
        for (const doc of enrollmentsSnapshot.docs) {
            const data = applySchema(ENROLLMENT_SCHEMA, doc.data());
            const studentDoc = await db.collection('users').doc(data.studentId).get();
            if (studentDoc.exists && studentDoc.data().department_id === deptId) {
                enrollments.push({
                    id: doc.id,
                    ...data,
                    studentName: studentDoc.data().full_name || 'Unknown Student'
                });
            }
        }

        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify an enrollment (status -> Verified_Pending_Payment)
export const verifyEnrollment = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        await db.collection('student_courses').doc(enrollmentId).update({
            status: 'Verified_Pending_Payment',
            updatedAt: new Date().toISOString()
        });
        res.status(200).json({ message: 'Enrollment verified. Student can now proceed to payment.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all pending payments for teacher's department
export const getPendingPayments = async (req, res) => {
    try {
        const teacherDoc = await db.collection('users').doc(req.user.uid).get();
        const deptId = teacherDoc.data().department_id;

        const paymentsSnapshot = await db.collection('payments')
            .where('status', '==', 'Pending_Approval')
            .get();

        const paymentsList = [];
        for (const doc of paymentsSnapshot.docs) {
            const data = applySchema(PAYMENT_SCHEMA, doc.data());
            const studentDoc = await db.collection('users').doc(data.studentId).get();
            if (studentDoc.exists && studentDoc.data().department_id === deptId) {
                paymentsList.push({
                    id: doc.id,
                    ...data,
                    studentName: studentDoc.data().full_name || 'Unknown Student'
                });
            }
        }
        res.status(200).json(paymentsList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify a payment (and activate enrollment)
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentRef = db.collection('payments').doc(paymentId);
        const paymentDoc = await paymentRef.get();

        if (!paymentDoc.exists) return res.status(404).json({ error: 'Payment not found' });

        const { studentId, courseId } = paymentDoc.data();

        // 1. Update Payment
        await paymentRef.update({
            status: 'Verified',
            verifiedAt: new Date().toISOString()
        });

        // 2. Update Enrollment to Active
        const enrollmentId = `${studentId}_${courseId}`;
        await db.collection('student_courses').doc(enrollmentId).update({
            status: 'Enrolled_Active',
            updatedAt: new Date().toISOString()
        });

        res.status(200).json({ message: 'Payment verified and enrollment activated.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- EXAMS ---

// Create a new exam
export const createExam = async (req, res) => {
    try {
        const examData = applySchema(EXAM_SCHEMA, {
            ...req.body,
            createdBy: req.user.uid,
            createdAt: new Date().toISOString()
        });

        const docRef = await db.collection('exams').add(examData);
        res.status(201).json({ id: docRef.id, ...examData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all exams created by this teacher
export const getExams = async (req, res) => {
    try {
        const examsSnapshot = await db.collection('exams').where('createdBy', '==', req.user.uid).get();
        const examsList = examsSnapshot.docs
            .filter(doc => doc.id !== 'TEMPLATE_DO_NOT_DELETE')
            .map(doc => applySchema(EXAM_SCHEMA, { id: doc.id, ...doc.data() }));
        res.status(200).json(examsList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get ALL exams for courses in teacher's department
export const getAllExamsForDept = async (req, res) => {
    try {
        const teacherDoc = await db.collection('users').doc(req.user.uid).get();
        const deptId = teacherDoc.data()?.department_id;

        // Get all courses in this department
        let coursesSnap;
        if (deptId) {
            coursesSnap = await db.collection('courses').where('department', '==', deptId).get();
        } else {
            coursesSnap = await db.collection('courses').get();
        }
        const courseIds = coursesSnap.docs.map(d => d.id);

        if (courseIds.length === 0) return res.status(200).json([]);

        // Firestore 'in' supports up to 30 items
        const chunks = [];
        for (let i = 0; i < courseIds.length; i += 30) chunks.push(courseIds.slice(i, i + 30));

        const examsList = [];
        for (const chunk of chunks) {
            const snap = await db.collection('exams').where('courseId', 'in', chunk).get();
            snap.docs
                .filter(doc => doc.id !== 'TEMPLATE_DO_NOT_DELETE')
                .forEach(doc => examsList.push(applySchema(EXAM_SCHEMA, { id: doc.id, ...doc.data() })));
        }

        res.status(200).json(examsList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get ALL courses in teacher's department
export const getCoursesByDept = async (req, res) => {
    try {
        const teacherDoc = await db.collection('users').doc(req.user.uid).get();
        const deptId = teacherDoc.data()?.department_id;

        let snap;
        if (deptId) {
            snap = await db.collection('courses').where('department', '==', deptId).get();
        } else {
            snap = await db.collection('courses').get();
        }

        const courses = snap.docs
            .filter(doc => doc.id !== 'TEMPLATE_DO_NOT_DELETE')
            .map(doc => applySchema(COURSE_SCHEMA, { id: doc.id, ...doc.data() }));

        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get ALL students in teacher's department
export const getStudentsByDept = async (req, res) => {
    try {
        const teacherDoc = await db.collection('users').doc(req.user.uid).get();
        const deptId = teacherDoc.data()?.department_id;

        let snap;
        if (deptId) {
            snap = await db.collection('users')
                .where('role', '==', 'student')
                .where('department_id', '==', deptId)
                .get();
        } else {
            snap = await db.collection('users').where('role', '==', 'student').get();
        }

        const students = snap.docs
            .filter(doc => doc.id !== 'TEMPLATE_DO_NOT_DELETE')
            .map(doc => applySchema(USER_SCHEMA, { uid: doc.id, ...doc.data() }));

        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new course (teacher can create for their department)
export const createCourseByTeacher = async (req, res) => {
    try {
        const teacherDoc = await db.collection('users').doc(req.user.uid).get();
        const deptId = teacherDoc.data()?.department_id || '';

        const courseData = applySchema(COURSE_SCHEMA, {
            ...req.body,
            department: req.body.department || deptId,
            createdBy: req.user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        const docRef = await db.collection('courses').add(courseData);
        res.status(201).json({ id: docRef.id, ...courseData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all performance logs (for teacher's view)
export const getPerformance = async (req, res) => {
    try {
        const snapshot = await db.collection('performance').get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ performance: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};