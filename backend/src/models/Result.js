// backend/src/models/Result.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const resultSchema = new Schema({
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
    // Add fields for answers, grading details, etc.
});

export default model('Result', resultSchema);
