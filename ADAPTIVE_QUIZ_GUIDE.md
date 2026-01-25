# Adaptive Quiz System - Implementation Guide

## Overview

The adaptive quiz system allows you to create quizzes that dynamically adjust difficulty based on student performance, providing a personalized learning experience. This implementation includes machine learning-based difficulty progression algorithms.

## Features

### 1. For P2L Admins (Quiz Creation)

#### Create Adaptive Quiz
- **Access**: Navigate to `/p2ladmin/quizzes/create-adaptive`
- **Features**:
  - Set quiz title and description
  - Configure target correct answers (e.g., 10 correct answers to complete)
  - Choose difficulty progression strategy:
    - **Gradual**: Adjusts difficulty based on last 3 answers
    - **Immediate**: Adjusts after each answer
    - **ML-Based**: Uses overall accuracy to determine optimal difficulty
  - Specify question distribution by difficulty level (1-5)
  - Real-time validation of available questions

#### Difficulty Distribution
Configure how many questions of each difficulty level to include:
- Difficulty 1: Easiest questions
- Difficulty 2: Easy questions
- Difficulty 3: Medium questions
- Difficulty 4: Hard questions
- Difficulty 5: Hardest questions

Example: For a 30-question pool with target of 10 correct:
- Difficulty 1: 10 questions
- Difficulty 2: 10 questions
- Difficulty 3: 10 questions

### 2. For Students (Quiz Attempt)

#### View Available Quizzes
- **Access**: Navigate to `/student/adaptive-quizzes`
- See all available adaptive quizzes
- View quiz details:
  - Total questions in pool
  - Target correct answers
  - Difficulty distribution
  - Progression strategy

#### Attempt Quiz
- **Access**: Click "Start Quiz" on any adaptive quiz
- **Experience**:
  1. Start with difficulty 1 questions
  2. Answer questions one at a time
  3. Get immediate feedback after each answer
  4. Watch difficulty adjust based on performance
  5. Complete when target correct answers is reached
  6. View detailed results with progression chart

#### Quiz Progression
- **Progress Bar**: Shows how many correct answers achieved vs target
- **Current Difficulty**: Displays current difficulty level (1-5)
- **Adaptive Difficulty**: Level changes based on your performance
- **Immediate Feedback**: See if your answer was correct or incorrect
- **Question Pool**: Random selection from available questions at current difficulty

### 3. Results and Analytics

#### Quiz Results
After completing a quiz, students see:
- Total correct answers vs target
- Total questions attempted
- Overall accuracy percentage
- Difficulty progression chart showing:
  - Each question number
  - Difficulty level for that question
  - Whether it was answered correctly

#### Attempt History
Students can view:
- All their quiz attempts
- Completion status
- Score and accuracy
- Date and time of attempt
- Option to view detailed results

## API Endpoints

### For P2L Admins

#### Create Adaptive Quiz
```
POST /api/p2ladmin/quizzes/generate-adaptive
Headers: Authorization: Bearer <token>
Body: {
  "title": "Adaptive Math Quiz Level 1",
  "description": "Quiz description",
  "difficulty_distribution": {
    "1": 10,
    "2": 10,
    "3": 10
  },
  "target_correct": 10,
  "difficulty_progression": "gradual"
}
```

### For Students

#### Get Available Quizzes
```
GET /api/adaptive-quiz/quizzes
Headers: Authorization: Bearer <token>
```

#### Start Quiz Attempt
```
POST /api/adaptive-quiz/quizzes/:quizId/start
Headers: Authorization: Bearer <token>
```

#### Get Next Question
```
GET /api/adaptive-quiz/attempts/:attemptId/next-question
Headers: Authorization: Bearer <token>
```

#### Submit Answer
```
POST /api/adaptive-quiz/attempts/:attemptId/submit-answer
Headers: Authorization: Bearer <token>
Body: {
  "questionId": "<question_id>",
  "answer": "student answer"
}
```

#### Get Results
```
GET /api/adaptive-quiz/attempts/:attemptId/results
Headers: Authorization: Bearer <token>
```

#### Get Attempt History
```
GET /api/adaptive-quiz/my-attempts
Headers: Authorization: Bearer <token>
```

## Difficulty Progression Algorithms

### 1. Gradual Progression
- Looks at the last 3 answers
- Increases difficulty if 2 or more are correct
- Decreases difficulty if 1 or fewer are correct (after 3 answers)
- **Use case**: Balanced progression for most students

### 2. Immediate Progression
- Adjusts difficulty after each answer
- Increases on correct answer
- Decreases on incorrect answer
- **Use case**: Fast-paced, responsive difficulty adjustment

### 3. ML-Based Progression
- Calculates overall accuracy: correct_count / total_answered
- Determines target difficulty: ceil(accuracy × 5)
- Gradually moves towards target difficulty
- **Use case**: Sophisticated, data-driven difficulty adjustment

## Database Models

### Quiz Model (Enhanced)
```javascript
{
  title: String,
  description: String,
  questions: [{
    question_id: ObjectId,
    text: String,
    choices: [String],
    answer: String,
    difficulty: Number (1-5)
  }],
  is_adaptive: Boolean,
  adaptive_config: {
    target_correct_answers: Number,
    difficulty_progression: String,
    starting_difficulty: Number
  }
}
```

### QuizAttempt Model (Enhanced)
```javascript
{
  userId: ObjectId,
  quizId: ObjectId,
  score: Number,
  answers: [{
    questionId: ObjectId,
    question_text: String,
    difficulty: Number,
    answer: String,
    correct_answer: String,
    isCorrect: Boolean,
    answeredAt: Date
  }],
  current_difficulty: Number,
  correct_count: Number,
  total_answered: Number,
  is_completed: Boolean,
  startedAt: Date,
  completedAt: Date
}
```

## Usage Examples

### Example 1: Basic Adaptive Quiz
**Scenario**: Create a quiz for beginners
- Target: 10 correct answers
- Pool: 30 questions (10 each at difficulty 1, 2, 3)
- Progression: Gradual
- **Result**: Students start easy and progress based on performance

### Example 2: Advanced Adaptive Quiz
**Scenario**: Challenge quiz for advanced students
- Target: 15 correct answers
- Pool: 50 questions (10 each at difficulty 2, 3, 4, 5)
- Progression: ML-Based
- **Result**: Algorithm finds optimal difficulty based on accuracy

### Example 3: Quick Assessment Quiz
**Scenario**: Fast skill assessment
- Target: 5 correct answers
- Pool: 20 questions (4 each at all 5 difficulties)
- Progression: Immediate
- **Result**: Rapidly adjusts to find student's level

## Best Practices

### For Quiz Creation
1. **Question Pool Size**: Have at least 2-3x the target correct answers
2. **Difficulty Distribution**: Include multiple difficulty levels for better adaptation
3. **Target Setting**: Set realistic targets (typically 10-15 correct answers)
4. **Progression Strategy**: 
   - Use "gradual" for beginners
   - Use "immediate" for quick assessments
   - Use "ml-based" for advanced adaptive learning

### For Students
1. **Take Your Time**: Answer questions thoughtfully
2. **Learn from Feedback**: Review incorrect answers
3. **Track Progress**: Monitor your difficulty progression
4. **Complete Attempts**: Finish what you start to see full results

## Troubleshooting

### Common Issues

**Issue**: Not enough questions available
- **Solution**: Ensure questions exist at each difficulty level in the database

**Issue**: Quiz not progressing
- **Solution**: Check that answers are being submitted correctly

**Issue**: Difficulty not changing
- **Solution**: Verify progression strategy is set correctly

**Issue**: Can't start quiz
- **Solution**: Check for incomplete attempts and complete or cancel them

## Future Enhancements

Potential improvements for the adaptive quiz system:
1. Advanced ML algorithms using student history
2. Subject-specific difficulty calibration
3. Time-based progression adjustments
4. Collaborative filtering for question difficulty
5. Personalized learning paths
6. Performance analytics and recommendations
7. Adaptive time limits per difficulty level
8. Question difficulty recalibration based on student data

## Support

For issues or questions about the adaptive quiz system:
- Check the logs for error messages
- Verify API endpoints are accessible
- Ensure proper authentication tokens
- Review the database for data consistency

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-25  
**Author**: Copilot AI Assistant
