# Topic-Based Quiz System Implementation

## Overview
This implementation adds support for creating and managing quizzes based on both **topic** and **quiz level** (1-10), allowing for much more granular quiz organization and management.

## Changes Made

### 1. Database Schema Updates

#### Quiz Model (`backend/models/Quiz.js`)
- **Added field**: `topic` (String, default: '')
- **Added index**: `{ topic: 1, quiz_level: 1, is_active: 1 }` for efficient querying
- Quizzes are now uniquely identified by the combination of topic + quiz_level

### 2. Backend API Changes

#### Quiz Generation Service (`backend/services/quizGenerationService.js`)
- Updated `generateQuiz()` function signature to include `topic` parameter:
  - Old: `generateQuiz(quizLevel, studentId, triggerReason, skipDuplicateCheck)`
  - New: `generateQuiz(quizLevel, topic, studentId, triggerReason, skipDuplicateCheck)`
- Modified duplicate check to consider both `quiz_level` AND `topic`
- Updated question filtering to query by both `quiz_level` AND `topic`
- Enhanced error messages to include topic information
- Updated `checkGenerationAvailability()` to check availability by topic + level

#### P2L Admin Routes (`backend/routes/p2lAdminRoutes.js`)
- **New endpoint**: `GET /api/p2ladmin/questions-topics`
  - Returns unique topics from question bank
  - Filters out empty topics and sorts alphabetically
- **Updated**: `POST /api/p2ladmin/quizzes/generate`
  - Now requires `topic` parameter (validation added)
  - Returns appropriate error if topic is missing
- **Updated**: `GET /api/p2ladmin/quizzes/check-availability/:level`
  - Accepts optional `topic` query parameter
  - Checks availability for specific topic + level combination

#### Teacher Routes (`backend/routes/mongoTeacherRoutes.js`)
- **Updated**: `GET /api/mongo/teacher/available-quizzes`
  - Now returns `topic` and `quiz_level` fields
  - Sorted by topic, quiz_level, then creation date
- **New endpoint**: `GET /api/mongo/teacher/available-topics`
  - Returns distinct topics available to the teacher
  - Respects teacher's school/class permissions
- **New endpoint**: `POST /api/mongo/teacher/launch-topic`
  - Launches ALL quizzes for a topic (all levels 1-10)
  - Validates teacher's assigned classes
  - Sets launch info for all quizzes in the topic
  - Returns count of quizzes launched
- **New endpoint**: `POST /api/mongo/teacher/revoke-topic/:topic`
  - Revokes launch for ALL quizzes in a topic
  - Only allows teacher to revoke quizzes they launched
  - Returns count of quizzes revoked

### 3. Frontend Changes

#### P2L Admin - Quiz Manager (`frontend/src/components/P2LAdmin/QuizManager.js`)
- Added topic state management
- Updated `fetchData()` to load topics from API
- Added topic dropdown in quiz generation form (required field)
- Updated form data to include topic
- Added validation to ensure topic is selected before generation
- Updated quiz cards to display topic badge
- Enhanced quiz metadata display to show topic information

#### Teacher - Quiz Assignment (`frontend/src/components/Teacher/QuizAssignment.js`)
- **Major UI Redesign** with two view modes:
  1. **Topics View** (Default):
     - Groups quizzes by topic
     - Shows topic cards with quiz count and level range
     - Single button to launch entire topic (all levels)
     - Shows launch status per topic
  2. **Individual Quizzes View**:
     - Shows all quizzes individually
     - Displays topic + level for each quiz
     - Allows launching/disabling individual quizzes

- **New Features**:
  - View toggle between Topics and Individual Quizzes
  - Launch entire topic with one click
  - Revoke entire topic with one click
  - Helper functions to group and analyze quizzes by topic
  - Enhanced modal supporting both single quiz and topic launches

#### Service Updates (`frontend/src/services/p2lAdminService.js`)
- Already had `getQuestionTopics()` method - no changes needed

## Usage Flow

### For P2L Admin:
1. Navigate to **Question Bank** and upload/create questions with topics
   - Questions must have: `topic`, `quiz_level` (1-10), `difficulty`, etc.
2. Navigate to **Quiz Manager**
3. Click **"Trigger Quiz Generation"**
4. **Select a topic** from the dropdown (required)
5. **Select quiz level** (1-10)
6. Click **"Generate Quiz"**
7. Repeat for each topic + level combination (e.g., Addition Level 1-10, Subtraction Level 1-10, etc.)

### For Teachers:
1. Navigate to **Launch Quiz**
2. **Option A - Launch by Topic (Recommended)**:
   - Stay in "View by Topics" mode
   - See all available topics grouped with their quiz counts
   - Click **"Launch Topic (All Levels)"** on desired topic
   - Select classes to launch for
   - All quizzes (levels 1-10) for that topic are launched at once
3. **Option B - Launch Individual Quizzes**:
   - Switch to "View Individual Quizzes" mode
   - See all quizzes listed individually
   - Click **"Launch Quiz"** on specific quiz
   - Select classes

### For Students:
- Students see launched quizzes in their quiz list
- System operates as before with adaptive progression
- Students progress through levels within each topic
- Grading and skill points work the same way

## Database Impact

### Before Implementation:
- Quizzes uniquely identified by: `quiz_level` only
- Maximum 10 active quizzes (one per level)

### After Implementation:
- Quizzes uniquely identified by: `topic` + `quiz_level`
- Unlimited quizzes possible (e.g., 10 levels × 4 topics = 40 quizzes)

### Backward Compatibility:
- Existing quizzes without topics will have `topic: ''` (empty string)
- They will still function normally
- Old quizzes are grouped under "General" topic in the UI

## Key Benefits

1. **Better Organization**: Quizzes organized by subject matter (Addition, Subtraction, etc.)
2. **Scalability**: Can create unlimited topics, each with 10 levels
3. **Efficient Management**: Teachers can launch entire topics at once
4. **Clearer Progress**: Students can see progress within each topic
5. **Flexible Content**: Admins can add new topics without affecting existing ones

## Technical Notes

### Index Strategy:
The compound index `{ topic: 1, quiz_level: 1, is_active: 1 }` enables efficient queries for:
- Finding all quizzes for a topic
- Finding specific topic + level combinations
- Filtering by active status

### Validation:
- Topic is now **required** for quiz generation
- Empty or whitespace-only topics are rejected
- Duplicate prevention checks both topic and level

### Error Handling:
- Clear error messages mention both topic and level
- Availability checks report question counts per topic + level
- Launch failures provide specific feedback about what went wrong

## Testing Recommendations

1. **Quiz Generation**:
   - Test generating quizzes for multiple topics and levels
   - Verify duplicate prevention works (same topic + level)
   - Check that questions are correctly filtered by topic

2. **Teacher Launch**:
   - Test launching entire topic (all levels)
   - Test launching individual quizzes
   - Verify revoke works for both topics and individual quizzes

3. **Student Access**:
   - Verify students see launched quizzes
   - Check that quiz progression works correctly
   - Ensure grading and points are calculated properly

4. **Edge Cases**:
   - Empty topic handling
   - Topic with missing levels (e.g., only levels 1, 3, 5)
   - Multiple teachers launching same topic

## Future Enhancements

Potential improvements for future iterations:
- Auto-generate all 10 levels for a topic at once
- Bulk operations (create multiple topics simultaneously)
- Topic-based analytics and reporting
- Student progress tracking per topic
- Pre-requisite topics (e.g., must complete Addition before Multiplication)
