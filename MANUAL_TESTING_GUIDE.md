# Manual Testing Guide for Adaptive Quiz Feature

This guide provides step-by-step instructions for manually testing the adaptive quiz functionality.

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm start
   ```
   Server should be running on http://localhost:5000

2. **Frontend Server Running**
   ```bash
   cd frontend
   npm start
   ```
   Frontend should be running on http://localhost:3000

3. **MongoDB Running**
   - Make sure MongoDB is running and accessible
   - Database: play2learn

4. **Test Accounts**
   - P2L Admin account (for creating quizzes)
   - Student account (for attempting quizzes)

## Part 1: Create Questions (P2L Admin)

### Step 1: Login as P2L Admin
1. Navigate to http://localhost:3000/login
2. Login with P2L Admin credentials
3. You should be redirected to the P2L Admin dashboard

### Step 2: Create Questions
1. Click on "Question Bank" in the dashboard
2. Create at least 10 questions for each difficulty level (1, 2, 3)
3. For each question:
   - Enter question text (e.g., "What is 2 + 2?")
   - Add 4 choices (A, B, C, D)
   - Set the correct answer
   - Set difficulty level (1-5)
   - Click "Create Question"

**Sample Questions:**

**Difficulty 1:**
- "What is 1 + 1?" → Answer: "2"
- "What is 2 + 2?" → Answer: "4"
- "What is 3 + 1?" → Answer: "4"
- "What is 5 - 1?" → Answer: "4"
- "What is 10 - 5?" → Answer: "5"

**Difficulty 2:**
- "What is 5 + 7?" → Answer: "12"
- "What is 15 - 8?" → Answer: "7"
- "What is 9 + 6?" → Answer: "15"
- "What is 20 - 13?" → Answer: "7"
- "What is 11 + 9?" → Answer: "20"

**Difficulty 3:**
- "What is 25 + 37?" → Answer: "62"
- "What is 50 - 28?" → Answer: "22"
- "What is 42 + 58?" → Answer: "100"
- "What is 100 - 47?" → Answer: "53"
- "What is 63 + 29?" → Answer: "92"

## Part 2: Create Adaptive Quiz (P2L Admin)

### Step 3: Navigate to Adaptive Quiz Creator
1. From the P2L Admin dashboard, click "Adaptive Quiz Manager"
2. Click "+ Create Adaptive Quiz" button
3. You should see the adaptive quiz creation form

### Step 4: Configure Adaptive Quiz
1. **Quiz Details:**
   - Title: "Math Adaptive Quiz - Level 1"
   - Description: "This quiz adapts to your skill level"

2. **Adaptive Settings:**
   - Target Correct Answers: 10
   - Difficulty Progression: Select "Gradual"

3. **Question Distribution:**
   - Difficulty 1: 10 questions
   - Difficulty 2: 10 questions
   - Difficulty 3: 10 questions
   - Difficulty 4: 0 questions
   - Difficulty 5: 0 questions

4. Click "Create Adaptive Quiz"

5. You should see a success message and be redirected to the quiz list

## Part 3: Attempt Adaptive Quiz (Student)

### Step 5: Login as Student
1. Logout from P2L Admin account
2. Navigate to http://localhost:3000/login
3. Login with Student credentials
4. You should be redirected to the Student dashboard

### Step 6: Access Adaptive Quizzes
1. In the Student dashboard, click "Adaptive Quizzes" 
   - Look for the 🎲 icon
2. You should see a list of available adaptive quizzes
3. Find "Math Adaptive Quiz - Level 1"
4. Verify the quiz shows:
   - Total questions: 30
   - Target: 10 correct
   - Difficulty distribution (10, 10, 10)

### Step 7: Start Quiz
1. Click "Start Quiz →" button
2. Quiz should start with a Difficulty 1 question
3. Progress bar should show 0 / 10 correct answers
4. Current difficulty should show "Level 1"

### Step 8: Answer Questions
**Test Scenario 1: All Correct Answers**
1. Answer the first question correctly
2. Click "Submit Answer"
3. You should see:
   - ✓ Correct feedback
   - Correct count increases to 1
   - Difficulty may stay at 1 or increase (gradual progression)
4. Click "Next Question"
5. Repeat until you get 10 correct answers
6. Quiz should complete automatically

**Expected Behavior:**
- Difficulty should gradually increase as you answer correctly
- You should see progression from Level 1 → Level 2 → Level 3
- Quiz ends when you reach 10 correct answers

### Step 9: View Results
1. After quiz completion, you should see:
   - Total correct: 10
   - Total answered: ~10-15 (depending on progression)
   - Accuracy: ~70-100%
   - Difficulty progression chart showing each question

2. The chart should show:
   - Question numbers
   - Difficulty level for each question
   - ✓ for correct, ✗ for incorrect

### Step 10: Test Different Progression
1. Go back to Adaptive Quizzes list
2. Start the same quiz again
3. This time, answer some questions incorrectly
4. Observe how difficulty adjusts:
   - Incorrect answers should maintain or decrease difficulty
   - Correct answers should increase difficulty

**Test Scenario 2: Mixed Answers**
1. Answer first 2 questions correctly (should increase to Level 2)
2. Answer next 2 questions incorrectly (should stay or decrease)
3. Continue until you reach 10 correct answers
4. Check the progression chart to see difficulty changes

## Part 4: Test Different Progression Strategies

### Step 11: Create Quiz with Immediate Progression
1. Login as P2L Admin
2. Create another adaptive quiz with:
   - Progression: "Immediate"
   - Other settings same as before

2. Login as Student and attempt this quiz
3. Observe that difficulty changes after EVERY answer

### Step 12: Create Quiz with ML-Based Progression
1. Login as P2L Admin
2. Create another adaptive quiz with:
   - Progression: "ML-Based"
   - Other settings same as before

2. Login as Student and attempt this quiz
3. Observe that difficulty adjusts based on overall accuracy

## Part 5: Verify Attempt History

### Step 13: Check Attempt History
1. As Student, go to Adaptive Quizzes page
2. Click "My Attempts" tab
3. You should see all your quiz attempts with:
   - Quiz title
   - Completion status
   - Score (correct/target)
   - Accuracy percentage
   - Date and time

## Expected Results Summary

✅ **Quiz Creation:**
- Admin can create adaptive quizzes with custom difficulty distribution
- System validates available questions
- Quiz is saved and appears in student's quiz list

✅ **Quiz Attempt:**
- Student starts with difficulty 1
- Difficulty adjusts based on performance
- Quiz ends when target correct answers is reached
- Immediate feedback after each answer

✅ **Difficulty Progression:**
- **Gradual:** Changes based on last 3 answers
- **Immediate:** Changes after each answer
- **ML-Based:** Changes based on overall accuracy

✅ **Results Display:**
- Shows correct count, total answered, accuracy
- Displays difficulty progression chart
- All data is saved and accessible in history

## Troubleshooting

### Issue: "Not enough questions available"
**Solution:** Create more questions at the specified difficulty level

### Issue: Quiz doesn't progress
**Solution:** Check browser console for errors, verify API endpoints are accessible

### Issue: Difficulty doesn't change
**Solution:** Verify progression strategy is set correctly, check that questions exist at different levels

### Issue: Can't start quiz
**Solution:** Check if there's an incomplete attempt, complete or delete it first

## API Testing (Optional)

You can also test the API directly using curl or Postman:

### Get Available Quizzes
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/adaptive-quiz/quizzes
```

### Start Quiz
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/adaptive-quiz/quizzes/QUIZ_ID/start
```

### Get Next Question
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/adaptive-quiz/attempts/ATTEMPT_ID/next-question
```

### Submit Answer
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"QUESTION_ID","answer":"A"}' \
  http://localhost:5000/api/adaptive-quiz/attempts/ATTEMPT_ID/submit-answer
```

## Success Criteria

The adaptive quiz feature is working correctly if:
- ✅ P2L Admin can create adaptive quizzes with difficulty distribution
- ✅ Students can view and start adaptive quizzes
- ✅ Quiz difficulty adjusts based on student performance
- ✅ Quiz ends when target correct answers is reached
- ✅ Results show difficulty progression chart
- ✅ All three progression strategies work as expected
- ✅ Attempt history is saved and accessible

---

**Last Updated:** 2026-01-25
