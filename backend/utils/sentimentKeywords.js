// Sentiment Analysis Keywords
// Used for enhanced sentiment detection in testimonials

const negativeKeywords = [
  // Strong negative words
  'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'despise',
  'poor', 'disappointing', 'frustrated', 'useless', 'waste', 'broken',
  'annoying', 'confusing', 'difficult', 'hard', 'problem', 'issue',
  'bad', 'regret', 'unhappy', 'dissatisfied', 'disappointed', 'disgusted',
  'pathetic', 'ridiculous', 'absurd', 'unacceptable', 'inadequate',
  'failure', 'fail', 'failed', 'failing', 'mess', 'disaster',
  'nightmare', 'frustrating', 'hopeless', 'worthless', 'unreliable',
  'slow', 'buggy', 'crashes', 'error', 'errors', 'wrong',
  'lacking', 'missing', 'incomplete', 'limited', 'boring', 'dull',
  
  // Negative phrases (order matters - check these first to avoid double-counting)
  'terrible experience', 'bad experience', 'worst experience', 'never again',
  'not good', 'not great', 'not recommended', 'dont recommend', "don't recommend", 
  'do not recommend', 'avoid', 'waste of time', 'waste of money',
  'not worth', 'not helpful', 'does not work', "doesn't work", 'didnt work', "didn't work"
];

const positiveKeywords = [
  // Strong positive words
  'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'loved', 'loving',
  'best', 'awesome', 'brilliant', 'outstanding', 'perfect', 'superb',
  'great', 'impressed', 'satisfied', 'happy', 'pleased', 'delighted', 'thrilled',
  'enjoyable', 'helpful', 'useful', 'valuable', 'effective', 'efficient',
  'reliable', 'smooth', 'easy', 'simple', 'intuitive', 'clear',
  'impressive', 'remarkable', 'exceptional', 'phenomenal', 'terrific',
  'fabulous', 'marvelous', 'splendid', 'magnificent', 'stellar',
  'fun', 'engaging', 'interesting', 'educational', 'informative',
  'recommend', 'recommended', 'appreciate', 'appreciated', 'thank',
  
  // Positive phrases (order matters - check these first to avoid double-counting)
  'highly recommend', 'strongly recommend', 'exceeded expectations',
  'great experience', 'amazing experience', 'wonderful experience',
  'love it', 'loved it', 'absolutely love', 'really love',
  'highly satisfied', 'very satisfied', 'extremely satisfied',
  'works great', 'works well', 'works perfectly'
];

/**
 * Analyze sentiment based on feedback text ONLY (ignoring star rating)
 * @param {string} message - The text to analyze
 * @param {number} rating - Star rating (1-5) - NOT USED for sentiment determination
 * @param {object} sentimentAnalyzer - Sentiment library instance
 * @returns {object} - { score: number, label: string }
 */
function analyzeSentiment(message, rating, sentimentAnalyzer) {
  // Base sentiment from library
  const sentimentResult = sentimentAnalyzer.analyze(message);
  let sentimentScore = sentimentResult.score;
  
  const lowerMessage = message.toLowerCase();
  
  // Track which parts of the message have been matched to avoid double-counting
  let matchedRanges = [];
  
  // Helper to check if a position overlaps with already matched ranges
  const isOverlapping = (start, end) => {
    return matchedRanges.some(([s, e]) => 
      (start >= s && start < e) || (end > s && end <= e) || (start <= s && end >= e)
    );
  };
  
  // Check negative keywords (phrases first, then single words)
  const sortedNegativeKeywords = [...negativeKeywords].sort((a, b) => b.length - a.length);
  for (const keyword of sortedNegativeKeywords) {
    let index = lowerMessage.indexOf(keyword);
    while (index !== -1) {
      const end = index + keyword.length;
      if (!isOverlapping(index, end)) {
        // Weight negative keywords more heavily (5 instead of 3)
        sentimentScore -= 5;
        matchedRanges.push([index, end]);
      }
      index = lowerMessage.indexOf(keyword, end);
    }
  }
  
  // Check positive keywords (phrases first, then single words)
  const sortedPositiveKeywords = [...positiveKeywords].sort((a, b) => b.length - a.length);
  for (const keyword of sortedPositiveKeywords) {
    let index = lowerMessage.indexOf(keyword);
    while (index !== -1) {
      const end = index + keyword.length;
      if (!isOverlapping(index, end)) {
        // Weight positive keywords more heavily (5 instead of 3)
        sentimentScore += 5;
        matchedRanges.push([index, end]);
      }
      index = lowerMessage.indexOf(keyword, end);
    }
  }
  
  // Determine sentiment label based ONLY on text analysis
  // Star rating is NOT considered per user request
  let sentimentLabel = 'neutral';
  
  if (sentimentScore > 2) {
    sentimentLabel = 'positive';
  } else if (sentimentScore < -2) {
    sentimentLabel = 'negative';
  }
  
  return {
    score: sentimentScore,
    label: sentimentLabel
  };
}

module.exports = {
  negativeKeywords,
  positiveKeywords,
  analyzeSentiment
};
