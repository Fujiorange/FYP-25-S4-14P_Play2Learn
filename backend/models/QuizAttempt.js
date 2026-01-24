const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    answer: { type: String },
    isCorrect: { type: Boolean }
  }],
  completedAt: { type: Date, default: Date.now },
  timeSpent: { type: Number } // in seconds
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
