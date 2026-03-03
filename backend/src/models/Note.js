import admin from 'firebase-admin';
import { NOTES_SCHEMA, applySchema } from '../utils/schema.js';

const db = admin.firestore();
const collection = db.collection('notes');

export const getNotesByCourse = async (courseId) => {
    const snapshot = await collection.where('courseId', '==', courseId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createNote = async (data) => {
    const note = applySchema(NOTES_SCHEMA, data);
    const docRef = await collection.add(note);
    return { id: docRef.id, ...note };
};

export const getAllNotes = async () => {
    const snapshot = await collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
