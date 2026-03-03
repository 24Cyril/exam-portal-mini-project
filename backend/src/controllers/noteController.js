import admin from 'firebase-admin';
import * as Note from '../models/Note.js';

export const getStudentNotes = async (req, res) => {
    try {
        const notes = await Note.getAllNotes();
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
