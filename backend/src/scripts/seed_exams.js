import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EXAM_SCHEMA, applySchema } from '../utils/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

const seedExams = async () => {
    console.log('Seeding mock and test exams...');

    // We get course ids: PY101, WEB101, ME101
    const courses = {
        'PY101': null,
        'WEB101': null,
        'ME101': null
    };

    for (const code of Object.keys(courses)) {
        const snap = await db.collection('courses').where('code', '==', code).get();
        if (!snap.empty) {
            courses[code] = snap.docs[0].id;
        }
    }

    const examsToCreate = [];

    if (courses['PY101']) {
        examsToCreate.push({
            title: 'Python Mock Test 1',
            courseId: courses['PY101'],
            exam_type: 'Mock',
            total_questions: 2,
            timeInMinutes: 10,
            passing_score: 50,
            exam_date: new Date().toISOString(),
            questions: [
                {
                    question: 'Which of the following describes Python?',
                    option_a: 'Compiled',
                    option_b: 'Interpreted',
                    option_c: 'Machine Language',
                    option_d: 'None of the above',
                    correctAnswer: 'B',
                    marks: 1
                },
                {
                    question: 'What is a decorator in Python?',
                    option_a: 'A variable type',
                    option_b: 'A class',
                    option_c: 'A function that takes another function and extends its behavior',
                    option_d: 'An error',
                    correctAnswer: 'C',
                    marks: 1
                }
            ],
            status: 'Live',
            createdBy: 'system'
        });
        examsToCreate.push({
            title: 'Python Main Exam',
            courseId: courses['PY101'],
            exam_type: 'Main',
            total_questions: 1,
            timeInMinutes: 30,
            passing_score: 40,
            exam_date: new Date(Date.now() + 86400000).toISOString(),
            questions: [
                {
                    question: 'What keyword is used to create a function in Python?',
                    option_a: 'func',
                    option_b: 'define',
                    option_c: 'def',
                    option_d: 'function',
                    correctAnswer: 'C',
                    marks: 2
                }
            ],
            status: 'Upcoming',
            createdBy: 'system'
        });
    }

    if (courses['WEB101']) {
        examsToCreate.push({
            title: 'Web Dev Mock Test',
            courseId: courses['WEB101'],
            exam_type: 'Mock',
            total_questions: 1,
            timeInMinutes: 15,
            passing_score: 40,
            exam_date: new Date().toISOString(),
            questions: [
                {
                    question: 'What does HTML stand for?',
                    option_a: 'Hyper Text Markup Language',
                    option_b: 'High Text Markup Language',
                    option_c: 'Hyper Tabular Markup Language',
                    option_d: 'None of these',
                    correctAnswer: 'A',
                    marks: 1
                }
            ],
            status: 'Live',
            createdBy: 'system'
        });
    }

    try {
        for (const exData of examsToCreate) {
            const snap = await db.collection('exams').where('title', '==', exData.title).get();
            if (snap.empty) {
                console.log(`➕ Adding Exam: ${exData.title}`);
                await db.collection('exams').add(applySchema(EXAM_SCHEMA, exData));
            } else {
                console.log(`📝 Updating Exam: ${exData.title}`);
                await db.collection('exams').doc(snap.docs[0].id).update(exData);
            }
        }
        console.log('✅ Exams seeded!');
        process.exit(0);
    } catch (e) {
        console.error('Error seeding exams:', e);
        process.exit(1);
    }
};

seedExams();
