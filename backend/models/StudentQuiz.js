const mongoose = require('mongoose');

const studentQuizSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_type: { type: String, enum: ['placement', 'regular'], required: true },
  profile_level: { type: Number, required: true },
  questions: [
    {
      question_text: String,
      operation: String,
      correct_answer: Number,
      student_answer: Number,
      is_correct: Boolean
    }
  ],
  score: { type: Number, default: 0 },
  total_questions: { type: Number, default: 15 },
  percentage: { type: Number, default: 0 },
  points_earned: { type: Number, default: 0 },
  completed_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentQuiz', studentQuizSchema);
