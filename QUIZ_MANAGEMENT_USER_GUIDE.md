# Quiz Management Feature - Complete User Guide

## 🎯 Overview

The Quiz Management feature allows teachers to control which quizzes students can access. This ensures that:
- **Placement quizzes** (Level 1) require students to have an active teacher
- **Adaptive quizzes** (Level 2+) are only accessible when enabled by a teacher

## 📍 How to Access

### From Teacher Dashboard:

1. Log in as a Teacher
2. From the main dashboard, locate the **"Quiz Management"** section (🎯 icon)
3. Click **"Launch Quiz"**
4. You'll be redirected to the Quiz Management page

### Direct URL:
- Navigate to: `/teacher/quiz-assignment`

## 🖥️ Teacher Dashboard Layout

```
╔════════════════════════════════════════════════════╗
║  Welcome back, Teacher! 👋                         ║
║  Manage your classes and students                  ║
╚════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────┐
│  Stats Cards                                        │
│  👥 Total Students    📚 My Classes                 │
└─────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ 📊 Student       │  │ 🎯 Quiz          │  ← NEW!
│    Monitoring    │  │    Management    │
│                  │  │                  │
│ • View Classes   │  │ • Launch Quiz  →│
│ • View Matrix    │  │                  │
│ • Leaderboard    │  └──────────────────┘
└──────────────────┘
```

## 📋 Quiz Management Page Features

### 1. Quiz List View

Each quiz card shows:
- **Quiz Title** with Level Badge (e.g., "Level 1", "Level 2")
- **Status Badge**: 
  - ✓ Enabled (green)
  - ✗ Disabled (red)
- **Quiz Type**: placement or adaptive
- **Special Badge**: 🎯 Placement Quiz (for Level 1)
- **Enabled Classes**: List of classes where quiz is active
- **Action Button**: Enable/Disable based on status

### 2. Quiz Card Examples

```
┌────────────────────────────────────────────────┐
│ Adaptive Math Quiz - Level 1        [Level 1] │
│                                    ✓ Enabled   │
│                                                │
│ Adaptive quiz                                  │
│ Type: adaptive                                 │
│ 🎯 Placement Quiz                              │
│                                                │
│ Classes: Primary 1A, Primary 1B                │
│                                                │
│ [Disable Quiz]                                 │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Advanced Math Quiz - Level 3       [Level 3]  │
│                                    ✗ Disabled  │
│                                                │
│ Adaptive quiz                                  │
│ Type: adaptive                                 │
│                                                │
│ [Enable for Classes]                           │
└────────────────────────────────────────────────┘
```

### 3. Enabling a Quiz

**Steps:**
1. Find a disabled quiz (✗ Disabled badge)
2. Click **"Enable for Classes"** button
3. A modal appears with your assigned classes
4. Select one or more classes by checking boxes:
   ```
   ┌─────────────────────────────────────┐
   │ Enable Quiz: Advanced Math Quiz     │
   │                                     │
   │ Select classes:                     │
   │ ☑ Primary 1A                        │
   │ ☑ Primary 1B                        │
   │ ☐ Primary 2A                        │
   │                                     │
   │ [Cancel]  [Enable Quiz]             │
   └─────────────────────────────────────┘
   ```
5. Click **"Enable Quiz"**
6. Success message appears
7. Quiz card updates to show ✓ Enabled status

### 4. Disabling a Quiz

**Steps:**
1. Find an enabled quiz that YOU launched (✓ Enabled badge)
2. Click **"Disable Quiz"** button
3. Confirm the action when prompted
4. Quiz becomes inaccessible to students
5. Quiz card updates to show ✗ Disabled status

**Note**: You can only disable quizzes YOU enabled. If another teacher enabled a quiz, you'll see:
```
[Enabled by Another Teacher] (grayed out button)
```

## 👨‍🎓 Student Experience

### Before (Without Feature):
- Students could access ALL quizzes immediately
- No teacher involvement required
- Placement quiz had no restrictions

### After (With Feature):

#### Placement Quiz (Level 1):
- ✅ Accessible: Student in class with active teacher
- ❌ Blocked: "🔒 Placement quiz requires an active teacher. Your class does not have a teacher assigned yet."
- ❌ Blocked: "🔒 Placement quiz requires class enrollment."

#### Adaptive Quizzes (Level 2+):
- ✅ Accessible: Teacher has enabled quiz for student's class
- ❌ Blocked: "🔒 This quiz has not been enabled yet. Please ask your teacher to enable it for your class."
- Only see quizzes enabled for their class

### Student View:
```
Available Quizzes (Student Dashboard)

┌──────────────────────────────────┐
│ Adaptive Math Quiz - Level 1     │
│ 20 questions                     │
│ [Start Quiz]                     │ ← Can access (teacher enabled)
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ 🔒 Advanced Math - Level 2       │
│ Not enabled for your class       │
│ (Ask your teacher)               │ ← Cannot access (not enabled)
└──────────────────────────────────┘
```

## 🔐 Access Control Rules

### Placement Quiz (Level 1):
```javascript
Requirements:
✓ Student enrolled in a class
✓ Class has assigned teachers
✓ At least one teacher is active (accountActive: true)

If ANY requirement fails → Access Denied
```

### Adaptive Quiz (Level 2+):
```javascript
Requirements:
✓ Quiz is launched (is_launched: true)
✓ One of:
  - Quiz enabled for student's class
  - Quiz enabled for student's school
  - Quiz enabled globally

If requirements not met → Access Denied
```

## 🎓 P2L Admin Role

P2L Admins create quizzes through the Quiz Manager:
1. Navigate to `/p2ladmin/quizzes`
2. Click "Generate Quiz"
3. Select quiz level (1-10)
4. Quiz is created but NOT enabled
5. Teachers must enable it for their classes

## 🔄 Complete Workflow

```
┌─────────────┐
│  P2L Admin  │
└──────┬──────┘
       │ 1. Creates quiz with level
       ▼
┌──────────────┐
│ Quiz Created │
│ (Disabled)   │
└──────┬───────┘
       │ 2. Teacher launches for classes
       ▼
┌──────────────┐
│   Teacher    │
│ Dashboard    │
└──────┬───────┘
       │ 3. Click "Launch Quiz"
       ▼
┌──────────────┐
│ Quiz Manager │
│   Page       │
└──────┬───────┘
       │ 4. Enable for classes
       ▼
┌──────────────┐
│ Quiz Enabled │
│ for Classes  │
└──────┬───────┘
       │ 5. Students can access
       ▼
┌──────────────┐
│   Student    │
│ Dashboard    │
└──────────────┘
```

## 📱 Responsive Design

The Quiz Management page is fully responsive:
- **Desktop**: Grid layout with multiple cards per row
- **Tablet**: 2 cards per row
- **Mobile**: 1 card per row, full-width buttons

## ⚠️ Important Notes

1. **Teacher Permissions**:
   - Can only launch quizzes for THEIR assigned classes
   - Can only revoke quizzes THEY launched
   - Cannot modify other teachers' quiz launches

2. **Quiz Levels**:
   - Level 1 = Placement Quiz (special requirements)
   - Levels 2-10 = Adaptive Quizzes (teacher-gated)

3. **No Auto-Launch**:
   - Previously, quizzes auto-launched when students accessed them
   - Now, teachers MUST explicitly enable quizzes

4. **Class Assignment**:
   - Quiz is enabled per class, not per school
   - Students only see quizzes for THEIR class
   - Exception: School-wide launches (optional)

## 🐛 Troubleshooting

### "No Quizzes Available"
- Check if P2L Admin has created quizzes
- Verify quizzes have appropriate levels (1-10)
- Ensure quizzes are active

### Students Can't Access Quiz
- Verify quiz is enabled for their class
- Check student is assigned to a class
- For Level 1: Ensure teacher is active

### Can't Enable Quiz
- Verify you have assigned classes
- Check if quiz is already enabled by another teacher
- Ensure quiz is active in system

## 📞 Support

For issues:
1. Create Support Ticket (Teacher Dashboard → Support)
2. Contact school administrator
3. Check implementation documentation

## 📚 Related Documentation

- `QUIZ_STATUS_MANAGEMENT_IMPLEMENTATION.md` - Technical details
- `SECURITY_SUMMARY.md` - Security analysis
- `TEACHER_DASHBOARD_QUIZ_MANAGEMENT.md` - Dashboard structure
