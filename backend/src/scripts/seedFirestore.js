import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
    USER_SCHEMA,
    COURSE_SCHEMA,
    ENROLLMENT_SCHEMA,
    PAYMENT_SCHEMA,
    EXAM_SCHEMA,
    RESULT_SCHEMA,
    NOTES_SCHEMA,
    DEPARTMENT_SCHEMA
} from '../utils/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const seedStructure = async () => {
    console.log('🚀 Uploading Master Data Structure to Firestore...');

    const collections = [
        { name: 'users', schema: USER_SCHEMA },
        { name: 'courses', schema: COURSE_SCHEMA },
        { name: 'student_courses', schema: ENROLLMENT_SCHEMA },
        { name: 'payments', schema: PAYMENT_SCHEMA },
        { name: 'exams', schema: EXAM_SCHEMA },
        { name: 'results', schema: RESULT_SCHEMA },
        { name: 'notes', schema: NOTES_SCHEMA },
        { name: 'departments', schema: DEPARTMENT_SCHEMA }
    ];

    try {
        for (const col of collections) {
            console.log(`📝 Setting structure for collection: ${col.name}`);

            // Create a template document that defines the structure
            await db.collection(col.name).doc('TEMPLATE_DO_NOT_DELETE').set({
                ...col.schema,
                _isTemplate: true,
                _description: `This document defines the full structure for the ${col.name} collection.`
            });
        }

        // Add some real sample data if courses are empty
        const coursesRef = db.collection('courses');
        const coursesSnap = await coursesRef.where('code', '==', 'CS101').get();

        if (coursesSnap.empty) {
            console.log('➕ Adding first real sample course...');
            await coursesRef.add({
                ...COURSE_SCHEMA,
                name: 'Computer Science 101',
                code: 'CS101',
                department: 'Engineering',
                description: 'Foundation course for CS students.',
                fee: '1500'
            });
        }

        console.log('✨ Data structure upload complete! Your database is now future-proofed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error uploading structure:', error);
        process.exit(1);
    }
};

seedStructure();
