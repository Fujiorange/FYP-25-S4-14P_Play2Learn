# Visual Mockup: Teacher Dashboard with Quiz Management

## Before (What you were seeing):

```
╔════════════════════════════════════════════════════════════╗
║  🎓 Play2Learn                        Teacher John Doe     ║
║                                       [Logout]             ║
╚════════════════════════════════════════════════════════════╝

     Welcome back, Teacher John Doe! 👋
     Manage your classes and students

     ┌──────────────────┐  ┌──────────────────┐
     │   👥             │  │   📚             │
     │   25             │  │   3              │
     │ Total Students   │  │ My Classes       │
     └──────────────────┘  └──────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ 👤 Profile           │  │ 📊 Student           │
│    Management        │  │    Monitoring        │
├──────────────────────┤  ├──────────────────────┤
│ View Profile      → │  │ View Classes &       │
└──────────────────────┘  │   Students        → │
                          │ View Student         │
┌──────────────────────┐  │   Matrix          → │
│ 💬 Communication     │  │ View Leaderboard  → │
├──────────────────────┤  └──────────────────────┘
│ Write Review/        │
│   Testimonial     → │  ┌──────────────────────┐
│ 📢 School            │  │ 🎫 Support           │
│   Announcements   → │  ├──────────────────────┤
└──────────────────────┘  │ Create Support       │
                          │   Ticket          → │
                          │ Track Support        │
                          │   Tickets         → │
                          └──────────────────────┘
```

## After (What you'll see now):

```
╔════════════════════════════════════════════════════════════╗
║  🎓 Play2Learn                        Teacher John Doe     ║
║                                       [Logout]             ║
╚════════════════════════════════════════════════════════════╝

     Welcome back, Teacher John Doe! 👋
     Manage your classes and students

     ┌──────────────────┐  ┌──────────────────┐
     │   👥             │  │   📚             │
     │   25             │  │   3              │
     │ Total Students   │  │ My Classes       │
     └──────────────────┘  └──────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ 👤 Profile           │  │ 📊 Student           │
│    Management        │  │    Monitoring        │
├──────────────────────┤  ├──────────────────────┤
│ View Profile      → │  │ View Classes &       │
└──────────────────────┘  │   Students        → │
                          │ View Student         │
┌──────────────────────┐  │   Matrix          → │
│ 🎯 Quiz Management   │  │ View Leaderboard  → │
│    ⭐ NEW! ⭐        │  └──────────────────────┘
├──────────────────────┤
│ Launch Quiz       → │  ┌──────────────────────┐
└──────────────────────┘  │ 💬 Communication     │
                          ├──────────────────────┤
┌──────────────────────┐  │ Write Review/        │
│ 🎫 Support           │  │   Testimonial     → │
├──────────────────────┤  │ 📢 School            │
│ Create Support       │  │   Announcements   → │
│   Ticket          → │  └──────────────────────┘
│ Track Support        │
│   Tickets         → │
└──────────────────────┘
```

## When You Click "Launch Quiz":

You'll be taken to the Quiz Management page:

```
╔════════════════════════════════════════════════════════════╗
║  🎯 Launch Quiz                            ← Back to       ║
║                                              Dashboard      ║
╚════════════════════════════════════════════════════════════╝

ℹ️ Enable quizzes for your classes. Students can only access 
   quizzes that you've enabled. Level 1 (Placement Quiz) 
   requires an active teacher.

┌────────────────────────────────────────────────────────────┐
│  Adaptive Math Quiz - Level 1              [Level 1]       │
│                                            ✓ Enabled        │
│                                                             │
│  Adaptive quiz                                              │
│  Type: adaptive                                             │
│  🎯 Placement Quiz                                          │
│                                                             │
│  Classes: Primary 1A, Primary 1B                            │
│                                                             │
│  [Disable Quiz]                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Intermediate Math - Level 2               [Level 2]       │
│                                            ✗ Disabled       │
│                                                             │
│  Adaptive quiz                                              │
│  Type: adaptive                                             │
│                                                             │
│  [Enable for Classes]                                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Advanced Math - Level 3                   [Level 3]       │
│                                            ✓ Enabled        │
│                                                             │
│  Adaptive quiz                                              │
│  Type: adaptive                                             │
│                                                             │
│  Classes: Primary 2A                                        │
│                                                             │
│  [Enabled by Another Teacher]    ← Can't modify            │
└────────────────────────────────────────────────────────────┘
```

## When You Click "Enable for Classes":

A modal appears:

```
        ┌──────────────────────────────────────┐
        │ Enable Quiz: Intermediate Math       │
        │                                      │
        │ Select the classes you want to       │
        │ enable this quiz for:                │
        │                                      │
        │  ┌────────────────────────────────┐ │
        │  │ ☑ Primary 1A                   │ │
        │  └────────────────────────────────┘ │
        │  ┌────────────────────────────────┐ │
        │  │ ☑ Primary 1B                   │ │
        │  └────────────────────────────────┘ │
        │  ┌────────────────────────────────┐ │
        │  │ ☐ Primary 2A                   │ │
        │  └────────────────────────────────┘ │
        │                                      │
        │  [Cancel]         [Enable Quiz]     │
        └──────────────────────────────────────┘
```

## Key Features Visible:

1. **🎯 Quiz Management Section** - New section on dashboard
2. **Launch Quiz Link** - Direct access to quiz management
3. **Visual Status Badges**:
   - ✓ Enabled (Green)
   - ✗ Disabled (Red)
4. **Level Badges** - Shows quiz difficulty (Level 1, 2, 3, etc.)
5. **Placement Quiz Indicator** - 🎯 for Level 1 quizzes
6. **Class Tags** - Shows which classes have access
7. **Action Buttons**:
   - "Enable for Classes" - For disabled quizzes
   - "Disable Quiz" - For quizzes you enabled
   - "Enabled by Another Teacher" - Grayed out for others' quizzes

## What Students See:

### Before Teacher Enables Quiz:
```
Available Quizzes

┌────────────────────────────────────┐
│ 🔒 Intermediate Math - Level 2     │
│                                    │
│ This quiz has not been enabled yet.│
│ Please ask your teacher to enable  │
│ it for your class.                 │
└────────────────────────────────────┘
```

### After Teacher Enables Quiz:
```
Available Quizzes

┌────────────────────────────────────┐
│ Adaptive Math Quiz - Level 1       │
│                                    │
│ 20 questions | Difficulty: Gradual │
│                                    │
│ [Start Quiz]                       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Intermediate Math - Level 2        │
│                                    │
│ 20 questions | Difficulty: Gradual │
│                                    │
│ [Start Quiz]                       │
└────────────────────────────────────┘
```

## Summary of Changes:

| Before | After |
|--------|-------|
| ❌ No quiz management visible | ✅ Quiz Management section added |
| ❌ No way to control quiz access | ✅ Enable/Disable quiz controls |
| ❌ Students access all quizzes | ✅ Teacher-controlled access |
| ❌ No placement quiz protection | ✅ Active teacher requirement |

## Navigation Path:

```
Login as Teacher
    ↓
Teacher Dashboard
    ↓
Click "Launch Quiz" (🎯 Quiz Management section)
    ↓
Quiz Management Page
    ↓
Enable/Disable Quizzes for Classes
```

That's it! You now have full control over which quizzes your students can access.
