// Improved Sentiment Analysis Utility
// Analyzes both text content and rating to determine overall sentiment

const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// Common negative keywords that might not be caught by default sentiment analysis
const NEGATIVE_KEYWORDS = [
  'bad', 'terrible', 'horrible', 'awful', 'poor', 'worst', 'disappointing',
  'frustrated', 'frustrating', 'useless', 'waste', 'annoying', 'difficult',
  'confusing', 'complicated', 'broken', 'buggy', 'slow', 'unreliable',
  'unhelpful', 'not helpful', 'not working', 'does not work', 'doesnt work',
  'not good', 'hate', 'dislike', 'regret', 'avoid', 'never', 'worse',
  'lacking', 'missing', 'failed', 'failure', 'problem', 'issue', 'error',
  'wrong', 'incorrect', 'inaccurate', 'misleading', 'fake', 'scam'
];

// Common positive keywords
const POSITIVE_KEYWORDS = [
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'love', 'like', 'enjoy', 'best', 'perfect', 'helpful', 'useful', 'easy',
  'simple', 'clear', 'effective', 'efficient', 'reliable', 'recommend',
  'outstanding', 'superb', 'brilliant', 'impressive', 'valuable', 'beneficial',
  'appreciate', 'satisfied', 'happy', 'pleased', 'delighted', 'thankful'
];

/**
 * Count occurrences of keywords in text
 * @param {string} text - Text to analyze
 * @param {string[]} keywords - Array of keywords to search for
 * @returns {number} Count of keyword occurrences
 */
function countKeywords(text, keywords) {
  const lowerText = text.toLowerCase();
  let count = 0;
  
  for (const keyword of keywords) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      count += matches.length;
    }
  }
  
  return count;
}

/**
 * Analyze sentiment based on both text content and rating
 * @param {string} message - The testimonial message
 * @param {number} rating - The rating (1-5)
 * @returns {object} - { score: number, label: string, details: object }
 */
function analyzeSentiment(message, rating) {
  // Get base sentiment from the sentiment library
  const sentimentResult = sentiment.analyze(message);
  let textScore = sentimentResult.score;
  
  // Count positive and negative keywords
  const negativeCount = countKeywords(message, NEGATIVE_KEYWORDS);
  const positiveCount = countKeywords(message, POSITIVE_KEYWORDS);
  
  // Adjust text score based on keyword counts
  // Each negative keyword reduces score by 2, each positive increases by 2
  const keywordAdjustment = (positiveCount * 2) - (negativeCount * 2);
  textScore += keywordAdjustment;
  
  // Determine rating contribution to sentiment
  // Rating: 1-2 (negative), 3 (neutral), 4-5 (positive)
  let ratingContribution = 0;
  if (rating <= 2) {
    ratingContribution = -5; // Strong negative
  } else if (rating === 3) {
    ratingContribution = 0; // Neutral
  } else if (rating === 4) {
    ratingContribution = 3; // Mild positive
  } else if (rating === 5) {
    ratingContribution = 5; // Strong positive
  }
  
  // However, if rating is high (4-5) but text has significant negative keywords,
  // prioritize the text sentiment
  if ((rating >= 4) && (negativeCount > positiveCount) && (negativeCount >= 2)) {
    // Text indicates negativity despite high rating
    // Reduce the rating contribution significantly
    ratingContribution = Math.min(ratingContribution, 1);
  }
  
  // Similarly, if rating is low (1-2) but text is positive
  if ((rating <= 2) && (positiveCount > negativeCount) && (positiveCount >= 2)) {
    // Text indicates positivity despite low rating
    // Reduce the negative rating contribution
    ratingContribution = Math.max(ratingContribution, -1);
  }
  
  // Calculate final score with weighted average
  // Text sentiment: 60%, Rating: 40%
  const finalScore = (textScore * 0.6) + (ratingContribution * 0.4);
  
  // Determine label based on final score
  // Wider neutral zone for more accurate detection
  let sentimentLabel = 'neutral';
  if (finalScore > 2) {
    sentimentLabel = 'positive';
  } else if (finalScore < -2) {
    sentimentLabel = 'negative';
  }
  
  return {
    score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
    label: sentimentLabel,
    details: {
      textScore,
      ratingContribution,
      positiveKeywords: positiveCount,
      negativeKeywords: negativeCount
    }
  };
}

module.exports = {
  analyzeSentiment
};
