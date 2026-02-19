# Topic-Based Student Profiling and Leaderboard System

## Overview
This implementation adds a comprehensive topic-based student profiling system that tracks performance across different topics (Addition, Subtraction, Multiplication, Division, etc.) with sophisticated scoring mechanics.

## Scoring System

### Dual Scoring Approach
The system implements two complementary scoring mechanisms:

#### 1. Per-Question Points (Granular)
**Formula:** `Points = Quiz Level × Question Difficulty × Time Multiplier`

**Time Multipliers:**
- < 5 seconds: 1.5× (very fast)
- 5-10 seconds: 1.4× (fast)
- 10-15 seconds: 1.3× (good)
- 15-20 seconds: 1.2× (average)
- ≥ 20 seconds: 1.0× (no bonus)

**Example Calculations:**
- Level 4, Difficulty 1 (easy), 3 seconds: 4 × 1 × 1.5 = 6 points
- Level 4, Difficulty 5 (hard), 3 seconds: 4 × 5 × 1.5 = 30 points
- Wrong answer: 0 points (no penalty)

#### 2. Quiz Performance Score (Holistic)
**Formula:** `Performance Score = Accuracy × (1 + Speed Bonus) × (1 + Difficulty Bonus)`

**Speed Bonus:**
Based on ratio of actual time to expected time (15 sec/question):
- < 50% of expected: +50% (0.5)
- 50-75% of expected: +30% (0.3)
- 75-100% of expected: +10% (0.1)
- 100-150% of expected: 0% (0.0)
- > 150% of expected: -20% (-0.2)

**Difficulty Bonus:**
`(Quiz Level - 1) × 0.2`
- Level 1: 0.0
- Level 4: 0.6
- Level 10: 1.8

**Example:**
- 80% accuracy, completed in 50% of expected time, Level 5:
- Score = 0.8 × (1 + 0.5) × (1 + 0.8) = 0.8 × 1.5 × 1.8 = 2.16
- Converted to 0-100 scale: min(216%, 100%) = 100%

## Database Models

### TopicProfile
Tracks student performance for each topic separately.

**Key Fields:**
- `userId`: Student reference
- `topic`: Topic name (e.g., "Addition")
- `totalPoints`: Sum of all points earned for this topic
- `totalQuizzesTaken`: Count of quiz attempts
- `averageAccuracy`: Percentage (0-100)
- `bestScore`: Highest single quiz score
- `highestLevelCompleted`: Maximum level passed with 70%+ accuracy
- `quizAttempts`: Array of detailed quiz history

**Indexes:**
- `{ userId: 1, topic: 1 }` - Unique constraint
- `{ topic: 1, totalPoints: -1 }` - For topic leaderboards
- `{ userId: 1, totalPoints: -1 }` - For user's topic rankings

### Updated QuizAttempt Fields
- `timeElapsed`: Time taken per answer (seconds)
- `pointsEarned`: Points earned per answer
- `totalPointsEarned`: Sum of all points in quiz

## Backend Services

### topicProfileService.js
**Functions:**
- `updateTopicProfileAfterQuiz(userId, quizAttempt, quiz)` - Updates topic profile after completion
- `getUserTopicProfiles(userId)` - Gets all topic profiles for a user
- `getTopicLeaderboard(topic, userIds, limit)` - Gets leaderboard for specific topic
- `getCombinedLeaderboard(userIds, limit)` - Gets combined leaderboard across all topics

### scoringUtils.js
**Functions:**
- `calculateQuestionPoints(isCorrect, quizLevel, difficultyLevel, timeSeconds)` - Per-question points
- `calculateQuizPerformanceScore(correctAnswers, totalQuestions, totalTimeSeconds, quizLevel)` - Overall score
- `calculateQuizResults(quizAttempt)` - Comprehensive quiz results calculation

## API Endpoints

### Teacher Endpoints

#### GET `/api/mongo/teacher/leaderboard/by-topic`
Get topic-specific leaderboard for teacher's classes.

**Query Parameters:**
- `topic` (required): Topic name
- `className` (optional): Filter by specific class

**Response:**
```json
{
  "success": true,
  "topic": "Addition",
  "leaderboard": [
    {
      "rank": 1,
      "userId": "...",
      "name": "John Doe",
      "class": "1A",
      "totalPoints": 450,
      "averageAccuracy": 85.5,
      "quizzesTaken": 5,
      "bestScore": 120,
      "highestLevel": 6
    }
  ]
}
```

#### GET `/api/mongo/teacher/leaderboard/combined`
Get combined leaderboard across all topics.

**Query Parameters:**
- `className` (optional): Filter by specific class

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "...",
      "name": "Jane Smith",
      "class": "1B",
      "totalPoints": 1250,
      "averageAccuracy": 88.2,
      "quizzesTaken": 15,
      "topicCount": 4,
      "topics": [
        {"topic": "Addition", "points": 450, "accuracy": 85.5},
        {"topic": "Subtraction", "points": 400, "accuracy": 90.0}
      ]
    }
  ]
}
```

#### GET `/api/mongo/teacher/leaderboard/topics`
Get list of available topics for leaderboard filtering.

**Response:**
```json
{
  "success": true,
  "topics": ["Addition", "Subtraction", "Multiplication", "Division"]
}
```

### Student Endpoints

#### GET `/api/mongo/student/my-topic-profiles`
Get student's own topic performance profiles.

**Response:**
```json
{
  "success": true,
  "profiles": [
    {
      "topic": "Addition",
      "totalPoints": 450,
      "averageAccuracy": 85.5,
      "quizzesTaken": 5,
      "bestScore": 120,
      "highestLevelCompleted": 6
    }
  ]
}
```

#### GET `/api/mongo/student/leaderboard/by-topic`
Get topic-specific leaderboard for student's school/class.

**Query Parameters:**
- `topic` (required): Topic name
- `classId` (optional): Filter by specific class (defaults to student's class)

#### GET `/api/mongo/student/leaderboard/combined`
Get combined leaderboard across all topics for student's school/class.

**Query Parameters:**
- `classId` (optional): Filter by specific class

#### GET `/api/mongo/student/leaderboard/topics`
Get list of available topics.

## Frontend Components

### Teacher: StudentLeaderboard.js
Enhanced with three view modes:

**1. Overall Points (📊)**
- Traditional points-based ranking
- Shows: Rank, Name, Class, Points, Level

**2. All Topics Combined (📚)**
- Aggregate performance across all topics
- Shows: Rank, Name, Class, Total Points, Topics Count, Avg Accuracy

**3. By Topic (🎯)**
- Topic-specific rankings
- Shows: Rank, Name, Class, Points, Accuracy, Quizzes Taken
- Filterable by topic dropdown

**Filters:**
- Class selection (All classes or specific class)
- Topic selection (for By Topic view)

### Student: ViewLeaderboard.js
(To be updated in future session)
- Will show personal topic breakdowns
- Topic navigation
- Comparison with peers

## Integration Points

### Quiz Completion Flow
When a quiz is completed (adaptiveQuizRoutes.js):

1. ✅ Calculate per-question points (already done during answer submission)
2. ✅ Calculate quiz performance score
3. ✅ Update MathSkills (existing)
4. ✅ Update streak and points (existing)
5. ✅ **NEW:** Update TopicProfile with:
   - Points earned
   - Accuracy percentage
   - Performance score
   - Quiz level attempted

### Data Flow
```
Student Completes Quiz
    ↓
Calculate Points & Performance
    ↓
Update QuizAttempt (with points/time)
    ↓
Update TopicProfile (aggregates)
    ↓
Available in Leaderboards
```

## Performance Considerations

### Indexes
All queries are indexed for efficiency:
- TopicProfile: Compound indexes on (userId, topic) and (topic, totalPoints)
- Aggregation pipelines use $match early to filter data

### Caching Strategy
Consider implementing caching for:
- Leaderboards (update every 5 minutes)
- Available topics list (update hourly)
- User topic profiles (update on quiz completion)

## Testing Scenarios

### Scoring Calculations
1. **Fast + Easy:** Level 1, Difficulty 1, 3 sec = 1 × 1 × 1.5 = 1.5 points
2. **Fast + Hard:** Level 10, Difficulty 5, 4 sec = 10 × 5 × 1.5 = 75 points
3. **Slow + Hard:** Level 10, Difficulty 5, 25 sec = 10 × 5 × 1.0 = 50 points
4. **Wrong Answer:** Any combination = 0 points

### Leaderboard Rankings
1. Student A: 500 pts in Addition, 400 pts in Subtraction = 900 total
2. Student B: 600 pts in Addition = 600 total
3. Combined leaderboard: A ranks higher (900 > 600)
4. Addition leaderboard: B ranks higher (600 > 500)

### Edge Cases
- Student with no quizzes taken (should not appear in leaderboards)
- Topic with no students (returns empty array)
- Class filter with no students (returns empty array)
- Division by zero in accuracy calculations (handled with 0 default)

## Future Enhancements

1. **Topic Mastery Badges:** Award badges for achieving 90%+ accuracy across all levels
2. **Topic Progression Graph:** Visual chart showing student's progress per topic
3. **Recommended Topics:** Suggest topics based on performance gaps
4. **Topic-Based Quiz Recommendations:** Suggest specific levels within topics
5. **Parent Dashboard:** Show child's topic breakdown
6. **Export Reports:** CSV/PDF export of topic performance
7. **Time-Based Analytics:** Track performance trends over time per topic

## Migration Notes

### Backwards Compatibility
- Existing quizzes without topics are handled gracefully
- Empty topic defaults to "General"
- Old QuizAttempt records work with new scoring (time defaults to 0)

### Data Migration (Optional)
If retroactive topic assignment is needed:
```javascript
// Analyze question text to infer topic
// Update existing QuizAttempt.answers with topic
// Recalculate TopicProfiles from historical data
```

## Success Metrics

Track these metrics to measure system effectiveness:

1. **Student Engagement:**
   - Average quizzes per topic per student
   - Topic completion rates (all 10 levels)

2. **Learning Outcomes:**
   - Average accuracy improvement per topic over time
   - Level progression speed per topic

3. **Teacher Usage:**
   - Leaderboard view frequency
   - Filter usage patterns (class vs topic)

4. **System Performance:**
   - Leaderboard query response times
   - Topic profile update times
   - Database query efficiency

## Conclusion

This topic-based profiling system provides granular insights into student performance while maintaining the existing overall points system. The dual scoring approach ensures both speed and accuracy are rewarded appropriately, and the flexible leaderboard views give teachers multiple perspectives on student achievement.
