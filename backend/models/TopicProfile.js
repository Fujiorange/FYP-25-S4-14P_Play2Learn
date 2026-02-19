const mongoose = require('mongoose');

// Topic-based student performance profile
// Tracks student's performance for each specific topic (Addition, Subtraction, etc.)
const topicProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  topic: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // Aggregate statistics
  totalPoints: { type: Number, default: 0 }, // Sum of all points earned for this topic
  totalQuizzesTaken: { type: Number, default: 0 }, // Count of quiz attempts for this topic
  totalQuestionsAnswered: { type: Number, default: 0 },
  totalCorrectAnswers: { type: Number, default: 0 },
  
  // Performance metrics
  averageAccuracy: { type: Number, default: 0 }, // Percentage (0-100)
  bestScore: { type: Number, default: 0 }, // Highest single quiz score
  averageScore: { type: Number, default: 0 }, // Average quiz score
  
  // Level progression tracking per topic
  highestLevelAttempted: { type: Number, default: 1, min: 1, max: 10 },
  highestLevelCompleted: { type: Number, default: 0, min: 0, max: 10 },
  
  // Detailed quiz history for this topic
  quizAttempts: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    quizLevel: { type: Number },
    score: { type: Number }, // Points earned in this quiz
    accuracy: { type: Number }, // Percentage (0-100)
    performanceScore: { type: Number }, // Calculated performance score
    questionsAnswered: { type: Number },
    correctAnswers: { type: Number },
    completedAt: { type: Date }
  }],
  
  // Recent activity
  lastQuizTaken: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries
topicProfileSchema.index({ userId: 1, topic: 1 }, { unique: true });
topicProfileSchema.index({ topic: 1, totalPoints: -1 }); // For leaderboards
topicProfileSchema.index({ userId: 1, totalPoints: -1 }); // For user's topic rankings

// Pre-save hook to update timestamps
topicProfileSchema.pre('save', function() {
  this.lastUpdated = Date.now();
});

// Method to update profile after a quiz attempt
topicProfileSchema.methods.updateAfterQuiz = function(quizData) {
  // Add quiz attempt to history
  this.quizAttempts.push({
    quizId: quizData.quizId,
    quizLevel: quizData.quizLevel,
    score: quizData.score,
    accuracy: quizData.accuracy,
    performanceScore: quizData.performanceScore,
    questionsAnswered: quizData.questionsAnswered,
    correctAnswers: quizData.correctAnswers,
    completedAt: new Date()
  });
  
  // Update aggregates
  this.totalPoints += quizData.score;
  this.totalQuizzesTaken += 1;
  this.totalQuestionsAnswered += quizData.questionsAnswered;
  this.totalCorrectAnswers += quizData.correctAnswers;
  
  // Update performance metrics
  this.averageAccuracy = (this.totalCorrectAnswers / this.totalQuestionsAnswered) * 100;
  this.bestScore = Math.max(this.bestScore, quizData.score);
  
  // Calculate average score from all quiz attempts
  const totalScore = this.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  this.averageScore = totalScore / this.quizAttempts.length;
  
  // Update level tracking
  this.highestLevelAttempted = Math.max(this.highestLevelAttempted, quizData.quizLevel);
  if (quizData.accuracy >= 70) { // Consider 70%+ accuracy as "completed"
    this.highestLevelCompleted = Math.max(this.highestLevelCompleted, quizData.quizLevel);
  }
  
  this.lastQuizTaken = new Date();
};

module.exports = mongoose.model('TopicProfile', topicProfileSchema);
