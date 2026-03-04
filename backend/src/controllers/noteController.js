import admin from 'firebase-admin';
import * as Note from '../models/Note.js';

export const getStudentNotes = async (req, res) => {
    try {
        // Fetch student profile to get department
        const studentDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
        const studentDept = studentDoc.exists ? studentDoc.data().department_id : null;

        let notes;
        if (studentDept) {
            // Fetch only notes for this department
            const snapshot = await admin.firestore().collection('notes').where('department_id', '==', studentDept).get();
            notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            // Fallback: if no department set, maybe show nothing or all (let's go with all for now but warn)
            notes = await Note.getAllNotes();
        }

        // Enrich notes with course names
        const enrichedNotes = await Promise.all(notes.map(async (note) => {
            if (note.courseId) {
                const courseDoc = await admin.firestore().collection('courses').doc(note.courseId).get();
                if (courseDoc.exists) {
                    return { ...note, courseName: courseDoc.data().name };
                }
            }
            return note;
        }));
        res.json(enrichedNotes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getNotesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const notes = await Note.getNotesByCourse(courseId);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addNote = async (req, res) => {
    try {
        const note = await Note.createNote(req.body);
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
