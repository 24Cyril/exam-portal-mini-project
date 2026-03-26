import { db } from '../src/config/firebase.js';
import admin from 'firebase-admin';

async function seedStudents() {
    try {
        const mockStudents = [
            {
                email: 'raj.student@example.com',
                full_name: 'Raj Patil',
                role: 'student',
                status: 'Active',
                department_id: 'Computer Science',
                roll_number: '101',
                year: '2',
                createdAt: new Date().toISOString()
            },
            {
                email: 'shreya.student@example.com',
                full_name: 'Shreya Iyer',
                role: 'student',
                status: 'Active',
                department_id: 'Computer Science',
                roll_number: '102',
                year: '3',
                createdAt: new Date().toISOString()
            },
            {
                email: 'amit.student@example.com',
                full_name: 'Amit Kumar',
                role: 'student',
                status: 'Active',
                department_id: 'Computer Science',
                roll_number: '103',
                year: '1',
                createdAt: new Date().toISOString()
            },
            {
                email: 'priya.student@example.com',
                full_name: 'Priya Sharma',
                role: 'student',
                status: 'Active',
                department_id: 'Mechanical Engineering',
                roll_number: '104',
                year: '4',
                createdAt: new Date().toISOString()
            },
            {
                email: 'karan.student@example.com',
                full_name: 'Karan Singh',
                role: 'student',
                status: 'Active',
                department_id: 'Electrical Engineering',
                roll_number: '105',
                year: '2',
                createdAt: new Date().toISOString()
            }
        ];

        let count = 0;
        for (const student of mockStudents) {
            try {
                const userRecord = await admin.auth().createUser({
                    email: student.email,
                    password: 'password123',
                    displayName: student.full_name
                });

                await db.collection('users').doc(userRecord.uid).set({
                    ...student,
                    uid: userRecord.uid,
                });
                console.log(`Created student: ${student.full_name} (${userRecord.uid})`);
                count++;
            } catch (err) {
                if (err.code === 'auth/email-already-exists') {
                    console.log(`Student ${student.email} already exists, checking DB...`);
                    // Find them in auth and make sure they are in db
                    const currUser = await admin.auth().getUserByEmail(student.email);
                    await db.collection('users').doc(currUser.uid).set({
                        ...student,
                        uid: currUser.uid,
                    });
                    count++;
                } else {
                    console.error('Error creating user', err);
                }
            }
        }

        console.log(`Successfully seeded ${count} students!`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding students:', error);
        process.exit(1);
    }
}

seedStudents();
