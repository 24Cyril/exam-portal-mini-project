import { db } from '../config/firebase.js';

// --- COURSES & ENROLLMENT ---

// Get all available courses for a student's department/branch
export const getAvailableCourses = async (req, res) => {
    try {
        // First get student's branch/dept from their profile
        const studentDoc = await db.collection('users').doc(req.user.uid).get();
        if (!studentDoc.exists) return res.status(404).json({ error: 'Student not found' });

        const studentInfo = studentDoc.data();

        // Fetch all courses
        const coursesSnapshot = await db.collection('courses').get();
        const studentEnrollments = await db.collection('student_courses').where('studentId', '==', req.user.uid).get();

        const enrolledMap = {};
        studentEnrollments.forEach(doc => {
            enrolledMap[doc.data().courseId] = doc.data().status;
        });

        const coursesList = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            enrollmentStatus: enrolledMap[doc.id] || 'Not Enrolled'
        }));

        res.status(200).json(coursesList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Enroll in a course (Initial status: Pending)
export const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const enrollmentId = `${req.user.uid}_${courseId}`;

        const enrollmentRef = db.collection('student_courses').doc(enrollmentId);
        const existing = await enrollmentRef.get();

        if (existing.exists) {
            return res.status(400).json({ error: 'Enrollment already exists' });
        }

        const enrollmentData = {
            studentId: req.user.uid,
            courseId,
            status: 'Pending',
            updatedAt: new Date().toISOString()
        };

        await enrollmentRef.set(enrollmentData);
        res.status(201).json({ id: enrollmentId, ...enrollmentData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Unenroll from a course (Only if Pending or Rejected)
export const unenrollFromCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const enrollmentId = `${req.user.uid}_${courseId}`;
        const enrollmentRef = db.collection('student_courses').doc(enrollmentId);
        const doc = await enrollmentRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Enrollment not found' });

        const status = doc.data().status;
        if (!['Pending', 'Rejected'].includes(status)) {
            return res.status(403).json({ error: 'Cannot unenroll from an active or approved course' });
        }

        await enrollmentRef.delete();
        res.status(200).json({ message: 'Unenrolled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- PAYMENTS ---

// Submit a manual payment for a course
export const submitPayment = async (req, res) => {
    try {
        const { courseId, paymentType, transactionId, amount } = req.body;

        const paymentData = {
            studentId: req.user.uid,
            courseId,
            amount,
            paymentType,
            transactionId,
            status: 'Pending_Approval',
            createdAt: new Date().toISOString()
        };

        const paymentRef = await db.collection('payments').add(paymentData);

        // Update enrollment status
        const enrollmentId = `${req.user.uid}_${courseId}`;
        await db.collection('student_courses').doc(enrollmentId).update({
            status: 'Payment_Submitted',
            paymentId: paymentRef.id,
            updatedAt: new Date().toISOString()
        });

        res.status(201).json({ id: paymentRef.id, ...paymentData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch student's payment history
export const getMyPayments = async (req, res) => {
    try {
        const snapshot = await db.collection('payments').where('studentId', '==', req.user.uid).get();
        const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- EXAMS ---

// Get all exams for students (based on enrolled active courses)
export const getMyExams = async (req, res) => {
    try {
        // 1. Get student's active courses
        const activeCoursesSnapshot = await db.collection('student_courses')
            .where('studentId', '==', req.user.uid)
            .where('status', '==', 'Enrolled_Active')
            .get();

        const courseIds = activeCoursesSnapshot.docs.map(doc => doc.data().courseId);

        if (courseIds.length === 0) return res.status(200).json([]);

        // 2. Fetch exams for those courses
        const examsSnapshot = await db.collection('exams').where('courseId', 'in', courseIds).get();
        const examsList = examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(examsList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const startExam = async (req, res) => {
    try {
        const { examId } = req.body;
        const examDoc = await db.collection('exams').doc(examId).get();
        if (!examDoc.exists) return res.status(404).json({ error: 'Exam not found' });

        res.status(200).json({ sessionId: Date.now().toString(), ...examDoc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const submitResult = async (req, res) => {
    try {
        const { examId, answers } = req.body;

        // 1. Fetch exam questions from Firestore for grading
        const examDoc = await db.collection('exams').doc(examId).get();
        if (!examDoc.exists) return res.status(404).json({ error: 'Exam not found' });

        const examData = examDoc.data();
        const questions = examData.questions || [];

        // 2. Grading logic
        let score = 0;
        const total = questions.length;

        const userAnswers = answers || {}; // Map of q_no -> selected_option

        questions.forEach((q, index) => {
            const studentAns = userAnswers[index + 1] || userAnswers[index]; // Support both 0 and 1 indexed
            if (studentAns && q.correctAnswer) {
                if (studentAns.toString().trim().toUpperCase() === q.correctAnswer.toString().trim().toUpperCase()) {
                    score += 1;
                }
            }
        });

        const resultData = {
            examId,
            studentId: req.user.uid,
            score,
            total,
            percentage: total > 0 ? (score / total) * 100 : 0,
            answers: userAnswers,
            submittedAt: new Date().toISOString(),
            status: 'Evaluated'
        };

        const docRef = await db.collection('results').add(resultData);
        res.status(201).json({ id: docRef.id, ...resultData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


