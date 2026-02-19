/**
 * Scoring Utility for Topic-Based Quiz System
 * 
 * Implements two complementary scoring mechanisms:
 * 1. Per-question points (granular, immediate feedback)
 * 2. Overall quiz performance score (holistic assessment)
 */

/**
 * Calculate time multiplier based on answer speed
 * @param {Number} timeSeconds - Time taken to answer in seconds
 * @returns {Number} Multiplier (1.0 to 1.5)
 */
function getTimeMultiplier(timeSeconds) {
  if (timeSeconds < 5) return 1.5;      // Very fast
  if (timeSeconds < 10) return 1.4;     // Fast
  if (timeSeconds < 15) return 1.3;     // Good
  if (timeSeconds < 20) return 1.2;     // Average
  return 1.0;                            // Slow (no bonus)
}

/**
 * Calculate points earned for a single question
 * Formula: Quiz Level × Question Difficulty × Time Multiplier
 * @param {Boolean} isCorrect - Whether answer was correct
 * @param {Number} quizLevel - Quiz level (1-10)
 * @param {Number} difficultyLevel - Question difficulty (1-5)
 * @param {Number} timeSeconds - Time taken to answer
 * @returns {Number} Points earned (0 if incorrect)
 */
function calculateQuestionPoints(isCorrect, quizLevel, difficultyLevel, timeSeconds) {
  if (!isCorrect) return 0; // Wrong answer = 0 points (no penalty)
  
  const timeMultiplier = getTimeMultiplier(timeSeconds);
  const rawPoints = quizLevel * difficultyLevel * timeMultiplier;
  
  return Math.round(rawPoints * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate speed bonus for overall quiz performance
 * Based on ratio of actual time to expected time
 * @param {Number} actualTimeSeconds - Total time taken
 * @param {Number} expectedTimeSeconds - Expected time (e.g., 15 sec per question)
 * @returns {Number} Speed bonus (-0.2 to 0.5)
 */
function calculateSpeedBonus(actualTimeSeconds, expectedTimeSeconds) {
  const ratio = actualTimeSeconds / expectedTimeSeconds;
  
  if (ratio < 0.5) return 0.5;          // < 50% of expected → +50%
  if (ratio < 0.75) return 0.3;         // 50-75% of expected → +30%
  if (ratio < 1.0) return 0.1;          // 75-100% of expected → +10%
  if (ratio < 1.5) return 0.0;          // 100-150% of expected → 0%
  return -0.2;                          // > 150% of expected → -20%
}

/**
 * Calculate difficulty bonus based on quiz level
 * Formula: (Quiz Level - 1) × 0.2
 * @param {Number} quizLevel - Quiz level (1-10)
 * @returns {Number} Difficulty bonus (0.0 to 1.8)
 */
function calculateDifficultyBonus(quizLevel) {
  return (quizLevel - 1) * 0.2;
}

/**
 * Calculate overall quiz performance score
 * Formula: Accuracy × (1 + Speed Bonus) × (1 + Difficulty Bonus)
 * @param {Number} correctAnswers - Number of correct answers
 * @param {Number} totalQuestions - Total questions answered
 * @param {Number} totalTimeSeconds - Total time taken for quiz
 * @param {Number} quizLevel - Quiz level (1-10)
 * @param {Number} expectedTimePerQuestion - Expected time per question (default: 15 seconds)
 * @returns {Number} Performance score (0-100 scale)
 */
function calculateQuizPerformanceScore(
  correctAnswers,
  totalQuestions,
  totalTimeSeconds,
  quizLevel,
  expectedTimePerQuestion = 15
) {
  if (totalQuestions === 0) return 0;
  
  // Calculate accuracy (0-1 scale)
  const accuracy = correctAnswers / totalQuestions;
  
  // Calculate expected time
  const expectedTime = totalQuestions * expectedTimePerQuestion;
  
  // Get bonuses/penalties
  const speedBonus = calculateSpeedBonus(totalTimeSeconds, expectedTime);
  const difficultyBonus = calculateDifficultyBonus(quizLevel);
  
  // Calculate performance score
  const performanceScore = accuracy * (1 + speedBonus) * (1 + difficultyBonus);
  
  // Convert to 0-100 scale and cap at 100
  return Math.min(Math.round(performanceScore * 100), 100);
}

/**
 * Calculate total points from quiz attempt
 * Sums up all per-question points
 * @param {Array} answers - Array of answer objects with {isCorrect, quizLevel, difficulty, timeElapsed, pointsEarned}
 * @returns {Number} Total points earned
 */
function calculateTotalPoints(answers) {
  if (!answers || answers.length === 0) return 0;
  
  return answers.reduce((total, answer) => {
    return total + (answer.pointsEarned || 0);
  }, 0);
}

/**
 * Calculate comprehensive quiz results
 * Returns both granular points and performance score
 * @param {Object} quizAttempt - Quiz attempt object with answers array
 * @returns {Object} Scoring results
 */
function calculateQuizResults(quizAttempt) {
  const {
    answers = [],
    startedAt,
    completedAt
  } = quizAttempt;
  
  // Get quiz level from first answer or quiz metadata
  const quizLevel = answers[0]?.quizLevel || quizAttempt.quizLevel || 1;
  
  // Calculate per-question points if not already calculated
  const processedAnswers = answers.map(answer => {
    if (answer.pointsEarned !== undefined) {
      return answer; // Already calculated
    }
    
    const points = calculateQuestionPoints(
      answer.isCorrect,
      quizLevel,
      answer.difficulty || 3,
      answer.timeElapsed || 15
    );
    
    return {
      ...answer,
      pointsEarned: points
    };
  });
  
  // Calculate totals
  const totalQuestions = processedAnswers.length;
  const correctAnswers = processedAnswers.filter(a => a.isCorrect).length;
  const totalPoints = processedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
  
  // Calculate total time
  const totalTimeSeconds = completedAt && startedAt
    ? Math.round((new Date(completedAt) - new Date(startedAt)) / 1000)
    : processedAnswers.reduce((sum, a) => sum + (a.timeElapsed || 0), 0);
  
  // Calculate performance score
  const performanceScore = calculateQuizPerformanceScore(
    correctAnswers,
    totalQuestions,
    totalTimeSeconds,
    quizLevel
  );
  
  // Calculate accuracy percentage
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  return {
    totalPoints: Math.round(totalPoints * 10) / 10,
    performanceScore,
    accuracy: Math.round(accuracy * 10) / 10,
    correctAnswers,
    totalQuestions,
    totalTimeSeconds,
    quizLevel,
    processedAnswers
  };
}

module.exports = {
  getTimeMultiplier,
  calculateQuestionPoints,
  calculateSpeedBonus,
  calculateDifficultyBonus,
  calculateQuizPerformanceScore,
  calculateTotalPoints,
  calculateQuizResults
};
