# Quiz Status Management Implementation

## Overview
This implementation adds quiz status management to control student access to quizzes based on teacher enablement and class enrollment.

## Problem Statement
Previously, students could access all quizzes immediately without any restrictions. The new system requires:
1. **Placement Quiz (Level 1)**: Students must be in a class with an active teacher
2. **Adaptive Quizzes (Level 2+)**: Teachers must enable quizzes for their classes before students can access them

## Implementation Summary

### 1. Backend Changes

#### A. Student Quiz Access Control (`backend/routes/adaptiveQuizRoutes.js`)

**GET `/api/adaptive-quiz/quizzes`**
- **Before**: Returned all active adaptive quizzes
- **After**: 
  - Filters quizzes by student's class and school
  - Only shows launched/enabled quizzes
  - Checks `launched_for_classes` array or `launched_for_school` field

**POST `/api/adaptive-quiz/quizzes/:quizId/start`**
- **Before**: Auto-launched quizzes if not already launched
- **After**:
  - **Placement Quiz (Level 1) Validation**:
    - Verifies student is enrolled in a class
    - Checks if class has active teachers assigned
    - Returns error if no active teacher found
  - **Adaptive Quiz Validation**:
    - Verifies quiz is launched (`is_launched: true`)
    - Checks if quiz is enabled for student's class or school
    - Returns helpful error messages if not enabled
  - **Removed**: Auto-launch behavior

#### B. Teacher Quiz Management (`backend/routes/mongoTeacherRoutes.js`)

**POST `/api/mongo/teacher/launch-quiz`**
- **Updated**: 
  - Stores class names (not IDs) in `launched_for_classes` for consistency
  - Adds `launched_for_school` field with teacher's school ID
  - Validates that teacher teaches the selected classes

**GET `/api/mongo/teacher/available-quizzes`**
- **Existing**: Already filters quizzes by teacher's school and classes
- **Now**: Works seamlessly with new validation logic

**POST `/api/mongo/teacher/revoke-quiz/:quizId`**
- **Existing**: Allows teachers to revoke quizzes they launched

#### C. Quiz Model (`backend/models/Quiz.js`)
- **Existing Fields** (no changes needed):
  - `is_launched`: Boolean flag for quiz enablement
  - `launched_by`: Reference to user who launched the quiz
  - `launched_for_classes`: Array of class names
  - `launched_for_school`: School ID string
  - `quiz_level`: Number (1-10) for quiz difficulty level

### 2. Frontend Changes

#### A. Teacher Quiz Assignment Component (`frontend/src/components/Teacher/QuizAssignment.js`)

**New Features:**
- **Launch Quiz Modal**: Teachers can select which classes to enable a quiz for
- **Enable/Disable Buttons**: Visual controls for quiz management
- **Status Indicators**: 
  - Green badge: Enabled
  - Red badge: Disabled
  - Yellow badge: Quiz level
- **Access Control**: 
  - Teachers can only disable quizzes they enabled
  - Quizzes enabled by other teachers show "Enabled by Another Teacher"

**User Flow:**
1. Teacher navigates to `/teacher/quiz-assignment`
2. Sees all available quizzes with their status
3. Clicks "Enable for Classes" on a disabled quiz
4. Selects classes from modal
5. Quiz becomes available for students in those classes
6. Can later disable the quiz if needed

#### B. P2L Admin Quiz Manager (`frontend/src/components/P2LAdmin/QuizManager.js`)

**No Changes Needed:**
- Already supports creating quizzes with `quiz_level` field
- Quiz generation by level (1-10) already implemented
- Displays quiz level badges

### 3. Access Control Logic

#### Placement Quiz (Level 1) Access Rules
```javascript
// Student must satisfy ALL conditions:
1. Student.class !== null  // Enrolled in a class
2. Class.teachers.length > 0  // Class has teachers
3. At least one teacher is active (accountActive: true, role: 'Teacher')
```

#### Adaptive Quiz (Level 2+) Access Rules
```javascript
// Quiz must satisfy ONE of:
1. quiz.launched_for_classes.includes(student.class)  // Enabled for student's class
2. quiz.launched_for_school === student.schoolId  // Enabled for student's school
3. quiz.launched_for_classes.length === 0 && !quiz.launched_for_school  // Global launch
```

### 4. Database Schema

**Quiz Model Fields:**
```javascript
{
  quiz_level: Number,  // 1-10
  is_launched: Boolean,  // default: false
  launched_by: ObjectId,  // User who launched
  launched_at: Date,
  launched_for_classes: [String],  // Class names
  launched_for_school: String,  // School ID
  launch_start_date: Date,  // Optional
  launch_end_date: Date  // Optional
}
```

**User Model Fields:**
```javascript
// Student
{
  role: 'Student',
  class: String,  // Class name
  schoolId: String
}

// Teacher
{
  role: 'Teacher',
  schoolId: String,
  assignedClasses: [String],  // Class names
  accountActive: Boolean
}
```

**Class Model Fields:**
```javascript
{
  class_name: String,
  school_id: ObjectId,
  teachers: [ObjectId],  // Array of teacher user IDs
  students: [ObjectId]
}
```

## User Stories

### Story 1: Student Accessing Placement Quiz
**Given**: A student is enrolled in a class with an active teacher  
**When**: The student attempts to access Level 1 (Placement Quiz)  
**Then**: The student can start the quiz

**Given**: A student is NOT in a class OR has no active teacher  
**When**: The student attempts to access Level 1  
**Then**: The student sees error: "Placement quiz requires an active teacher"

### Story 2: Teacher Enabling a Quiz
**Given**: A teacher has classes assigned  
**When**: The teacher navigates to Launch Quiz page  
**Then**: The teacher sees all available quizzes with enable/disable options

**Given**: A teacher clicks "Enable for Classes" on a quiz  
**When**: The teacher selects classes and confirms  
**Then**: The quiz becomes available for students in those classes

### Story 3: Student Accessing Adaptive Quiz
**Given**: A teacher has enabled a Level 2 quiz for Class A  
**When**: A student in Class A views available quizzes  
**Then**: The student sees the Level 2 quiz

**Given**: A teacher has NOT enabled a quiz for Class B  
**When**: A student in Class B views available quizzes  
**Then**: The student does NOT see that quiz

## Error Messages

### Student Errors
| Scenario | Error Message |
|----------|--------------|
| Not in a class | "🔒 Placement quiz requires class enrollment. Please contact your school administrator to be assigned to a class." |
| Class not found | "🔒 Your class could not be found. Please contact your school administrator." |
| No teachers in class | "🔒 Placement quiz requires an active teacher. Your class does not have a teacher assigned yet. Please contact your school administrator." |
| No active teachers | "🔒 Placement quiz requires an active teacher. Your class teachers are not active. Please contact your school administrator." |
| Quiz not enabled | "🔒 This quiz has not been enabled yet. Please ask your teacher to enable it for your class." |
| Quiz not for student's class | "🔒 This quiz has not been enabled for your class. Please ask your teacher to enable it." |

### Teacher Errors
| Scenario | Error Message |
|----------|--------------|
| No classes selected | "Please select at least one class" |
| Invalid classes | "No valid classes selected. You teach: [classes]" |

## Testing Checklist

- [ ] **Placement Quiz Access**
  - [ ] Student in class with active teacher can access Level 1
  - [ ] Student without class cannot access Level 1
  - [ ] Student with inactive teacher cannot access Level 1
  - [ ] Error messages are clear and helpful

- [ ] **Adaptive Quiz Access**
  - [ ] Student sees only enabled quizzes
  - [ ] Student cannot access disabled quizzes
  - [ ] Quiz filtering by class works correctly

- [ ] **Teacher Quiz Launch**
  - [ ] Teacher can enable quiz for their classes
  - [ ] Teacher can disable quiz they enabled
  - [ ] Teacher cannot modify quiz enabled by another teacher
  - [ ] Class selection modal works correctly

- [ ] **P2L Admin**
  - [ ] Can create quizzes with quiz_level field
  - [ ] Quiz level displays correctly

## Migration Notes

**No Database Migration Required**  
All required fields already exist in the Quiz model. Existing quizzes will have:
- `is_launched: false` by default
- Empty `launched_for_classes` array
- `null` `launched_for_school`

**Backward Compatibility**  
- Existing unlaunched quizzes remain unlaunched
- Teachers need to explicitly enable them
- Students won't see any quizzes until teachers enable them

## API Endpoints

### Student Endpoints
- `GET /api/adaptive-quiz/quizzes` - List available quizzes (filtered)
- `POST /api/adaptive-quiz/quizzes/:quizId/start` - Start quiz (with validation)

### Teacher Endpoints
- `GET /api/mongo/teacher/available-quizzes` - List all quizzes
- `POST /api/mongo/teacher/launch-quiz` - Enable quiz for classes
- `POST /api/mongo/teacher/revoke-quiz/:quizId` - Disable quiz

### P2L Admin Endpoints
- `POST /api/p2ladmin/quizzes/generate` - Create quiz with level

## Security Considerations

1. **Authorization**: All endpoints verify user roles
2. **Class Validation**: Teachers can only launch for their assigned classes
3. **Ownership**: Teachers can only revoke quizzes they launched
4. **Active Status**: Only active teachers count for placement quiz validation

## Future Enhancements

1. **Time-based Access**: Use `launch_start_date` and `launch_end_date` for scheduled quizzes
2. **Quiz Statistics**: Track launch rates and student completion by class
3. **Bulk Operations**: Enable/disable multiple quizzes at once
4. **Notifications**: Alert students when new quizzes are enabled
5. **Parent Visibility**: Allow parents to see available quizzes for their children

## Troubleshooting

### Students Cannot See Any Quizzes
- Check if quizzes are enabled (`is_launched: true`)
- Verify student is assigned to a class
- Ensure quiz is launched for that class or school

### Placement Quiz Not Accessible
- Verify student is in a class
- Check if class has teachers assigned
- Ensure at least one teacher is active

### Teacher Cannot Enable Quiz
- Verify teacher has assigned classes
- Check if another teacher already enabled it
- Ensure quiz exists and is active

## Files Modified

### Backend
- `backend/routes/adaptiveQuizRoutes.js` - Student quiz access control
- `backend/routes/mongoTeacherRoutes.js` - Teacher quiz launch logic

### Frontend
- `frontend/src/components/Teacher/QuizAssignment.js` - Teacher UI for launching quizzes

### Testing
- `test-quiz-access-control.js` - Validation test script

## Conclusion

This implementation provides fine-grained control over quiz access, ensuring:
- Students have proper teacher support (placement quiz)
- Teachers control when students can access content
- Clear error messages guide users
- Simple, intuitive UI for teachers
- Backward compatible with existing data
