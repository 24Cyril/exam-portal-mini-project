// backend/src/models/Exam.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const examSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Add other fields like questions array if needed
});

export default model('Exam', examSchema);
