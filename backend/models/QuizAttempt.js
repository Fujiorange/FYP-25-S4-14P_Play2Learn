const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Student taking the quiz
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // Quiz being attempted
  score: { type: Number, default: 0 }, // Progressive score for level decision (0-1 scale)
  
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId }, // Reference to question
    question_text: { type: String }, // Question text (stored for history)
    difficulty: { type: Number }, // Question difficulty (1-5)
    topic: { type: String }, // Math topic (Addition, Multiplication, etc.)
    answer: { type: String }, // Student's submitted answer
    correct_answer: { type: String }, // Correct answer for comparison
    isCorrect: { type: Boolean }, // Whether answer was correct
    timeElapsed: { type: Number, default: 0 }, // ✅ NEW: Time taken to answer in seconds
    pointsEarned: { type: Number, default: 0 }, // ✅ NEW: Points earned for this question
    answeredAt: { type: Date, default: Date.now } // When answered
  }],
  
  current_difficulty: { type: Number, default: 1 }, // Current difficulty level (1-5, adjusts per answer)
  correct_count: { type: Number, default: 0 }, // Total correct answers
  total_answered: { type: Number, default: 0 }, // Total questions answered
  totalPointsEarned: { type: Number, default: 0 }, // ✅ NEW: Sum of all pointsEarned from answers
  
  is_completed: { type: Boolean, default: false }, // Whether quiz is finished
  progressionData: { type: mongoose.Schema.Types.Mixed }, // Level progression decision data
  
  startedAt: { type: Date, default: Date.now }, // When quiz started
  completedAt: { type: Date } // When quiz completed (20 questions answered)
});

quizAttemptSchema.index({ userId: 1, is_completed: 1 }); // Find incomplete attempts
quizAttemptSchema.index({ userId: 1, startedAt: -1 }); // Quiz history sorted by date

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);