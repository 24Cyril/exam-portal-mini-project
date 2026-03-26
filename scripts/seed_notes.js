import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { COURSE_SCHEMA, NOTES_SCHEMA, applySchema } from './backend/src/utils/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = join(__dirname, './backend/serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const seedNotes = async () => {
    console.log('📚 Seeding specific notes requested by user...');

    const coursesToCreate = [
        { name: 'Python Programming', code: 'PY101', department: 'Computer Science', description: 'Comprehensive guide to Python.' },
        { name: 'Web Development', code: 'WEB101', department: 'Computer Science', description: 'HTML, CSS, JS and more.' },
        { name: 'Advanced Manufacturing Engineering', code: 'ME101', department: 'Mechanical Engineering', description: 'Modern manufacturing techniques.' }
    ];

    const notesToCreate = [
        { title: 'Python Basics & Advanced', courseCode: 'PY101', description: 'Core Python concepts, decorators, and generators.' },
        { title: 'Web Architecture & Frontend', courseCode: 'WEB101', description: 'Responsive design and modern frameworks.' },
        { title: 'Manufacturing Systems', courseCode: 'ME101', description: 'Automation and robotics in manufacturing.' }
    ];

    try {
        const courseIds = {};

        for (const cData of coursesToCreate) {
            const snap = await db.collection('courses').where('code', '==', cData.code).get();
            let courseId;
            if (snap.empty) {
                console.log(`➕ Creating course: ${cData.name}`);
                const docRef = await db.collection('courses').add(applySchema(COURSE_SCHEMA, cData));
                courseId = docRef.id;
            } else {
                courseId = snap.docs[0].id;
                console.log(`✓ Course exists: ${cData.name}`);
            }
            courseIds[cData.code] = courseId;
        }

        for (const nData of notesToCreate) {
            const courseId = courseIds[nData.courseCode];
            const snap = await db.collection('notes').where('title', '==', nData.title).get();

            if (snap.empty) {
                console.log(`➕ Adding note: ${nData.title}`);
                await db.collection('notes').add(applySchema(NOTES_SCHEMA, {
                    title: nData.title,
                    description: nData.description,
                    courseId: courseId,
                    file_path: `/notes/${nData.courseCode.toLowerCase()}.pdf`
                }));
            } else {
                console.log(`✓ Note already exists: ${nData.title}`);
            }
        }

        console.log('✅ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding notes:', error);
        process.exit(1);
    }
};

seedNotes();
