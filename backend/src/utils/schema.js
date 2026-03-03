/**
 * This file defines the "Full Schema" for every collection in the system.
 * By merging incoming data with these templates, we ensure the code never breaks
 * due to missing fields (undefined errors).
 */

export const USER_SCHEMA = {
    uid: '',
    email: '',
    role: 'student', // student, teacher, admin
    status: 'Active',
    full_name: '',
    username: '',
    dob: '',
    gender: '',
    contact_number: '',
    address: '',
    age: '',
    blood_group: '',
    nationality: '',
    emergency_contact: '',
    city: '',
    state: '',
    pincode: '',
    country: '',

    // Student specific
    course: '', // Branch
    department_id: '',
    institute_name: '',
    year_of_study: '',
    enrollment_date: '',
    roll_number: '',
    semester: '',

    // Teacher specific
    specialization: '',
    employee_id: '',
    joining_date: '',

    // Admin specific
    institute_code: '',
    institute_email: '',

    // Metadata
    last_login: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const COURSE_SCHEMA = {
    name: '',
    code: '',
    department: '',
    description: '',
    duration: '',
    fee: '0',
    status: 'Active',
    createdBy: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const ENROLLMENT_SCHEMA = {
    studentId: '',
    courseId: '',
    status: 'Pending', // Pending, Verified_Pending_Payment, Enrolled_Active, Rejected
    paymentId: '',
    enrollmentDate: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export const PAYMENT_SCHEMA = {
    studentId: '',
    courseId: '',
    amount: '0',
    paymentType: 'Registration', // Registration, Monthly, ExamFee
    transactionId: '',
    paymentMethod: 'Manual',
    status: 'Pending_Approval', // Pending_Approval, Verified, Rejected
    rejectionReason: '',
    createdAt: new Date().toISOString(),
    verifiedAt: null
};

export const EXAM_SCHEMA = {
    title: '',
    description: '',
    courseId: '',
    total_questions: 0,
    timeInMinutes: 30,
    passing_score: 40,
    exam_date: '',
    questions: [], // Array of { question, options: [], correctAnswer, marks }
    status: 'Upcoming', // Upcoming, Live, Ended
    createdBy: '',
    createdAt: new Date().toISOString()
};

export const RESULT_SCHEMA = {
    examId: '',
    studentId: '',
    score: 0,
    total: 0,
    percentage: 0,
    status: 'Evaluated',
    answers: {}, // map of index -> selected
    submittedAt: new Date().toISOString()
};

export const NOTES_SCHEMA = {
    title: '',
    description: '',
    courseId: '',
    file_path: '',
    createdBy: '',
    createdAt: new Date().toISOString()
};

export const DEPARTMENT_SCHEMA = {
    name: '',
    code: '',
    createdAt: new Date().toISOString()
};

/**
 * Utility to merge data with schema safely
 */
export const applySchema = (schema, data) => {
    return { ...schema, ...data };
};
