# School Admin Creation & JWT Authentication Fixes - Visual Guide

## Critical Issues Fixed

### Issue 1: JWT_SECRET Mismatch (NEW - Authentication Failures)
### Issue 2: School Admin Role Mismatch (Creation Failures)

---

## Issue 1: JWT_SECRET Mismatch - CRITICAL

```
┌─────────────────────────────────────────────────────────────┐
│ BEFORE FIX - JWT Token Verification Failures                │
└─────────────────────────────────────────────────────────────┘

Step 1: User Logs In
┌──────────────────────────────────────────┐
│ POST /api/auth/login                     │
│ mongoAuthRoutes.js                       │
│                                          │
│ JWT_SECRET = 'dev-secret-...'            │
│                                          │
│ jwt.sign(payload, JWT_SECRET)            │
│ Returns token signed with:               │
│ 'dev-secret-change-this-in-production'   │
└──────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────┐
│ Token: eyJhbGc...                        │
│ (signed with 'dev-secret-...')           │
└──────────────────────────────────────────┘

Step 2: User Accesses School Admin Route
┌──────────────────────────────────────────┐
│ GET /api/school-admin/dashboard          │
│ schoolAdminRoutes.js                     │
│                                          │
│ JWT_SECRET = 'your-secret-key-...' ❌    │
│                                          │
│ jwt.verify(token, JWT_SECRET)            │
│                                          │
│ Token signed with: 'dev-secret-...'      │
│ Verifying with:    'your-secret-key...'  │
│                                          │
│ MISMATCH! ❌                             │
│ Returns: "Invalid token"                 │
└──────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ AFTER FIX - JWT Token Verification Success                  │
└─────────────────────────────────────────────────────────────┘

Step 1: User Logs In
┌──────────────────────────────────────────┐
│ POST /api/auth/login                     │
│ mongoAuthRoutes.js                       │
│                                          │
│ JWT_SECRET = 'dev-secret-...' ✅         │
│                                          │
│ jwt.sign(payload, JWT_SECRET)            │
│ Returns token signed with:               │
│ 'dev-secret-change-this-in-production'   │
└──────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────┐
│ Token: eyJhbGc...                        │
│ (signed with 'dev-secret-...')           │
└──────────────────────────────────────────┘

Step 2: User Accesses School Admin Route
┌──────────────────────────────────────────┐
│ GET /api/school-admin/dashboard          │
│ schoolAdminRoutes.js                     │
│                                          │
│ JWT_SECRET = 'dev-secret-...' ✅         │
│                                          │
│ jwt.verify(token, JWT_SECRET)            │
│                                          │
│ Token signed with: 'dev-secret-...'      │
│ Verifying with:    'dev-secret-...'      │
│                                          │
│ MATCH! ✅                                │
│ Returns: decoded user data               │
│ ✅ ACCESS GRANTED!                       │
└──────────────────────────────────────────┘
```

---

## Issue 2: School Admin Role Mismatch

```
┌─────────────────────────────────────────────────────────────┐
│ BEFORE FIX - School Admin Creation Failure                  │
└─────────────────────────────────────────────────────────────┘

Step 1: P2L Admin Creates School Admin
┌──────────────────────────────────────┐
│ POST /p2ladmin/schools/:id/admins    │
│ p2lAdminRoutes.js                    │
│                                      │
│ Creates User with:                   │
│ role: 'School Admin'  ← Space!       │
│ email: admin@school.com              │
│ password: hashed_temp_password       │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│ User Saved to MongoDB                │
│ {                                    │
│   email: "admin@school.com",         │
│   role: "School Admin",              │
│   password: "hash..."                │
│ }                                    │
└──────────────────────────────────────┘

Step 2: School Admin Tries to Login
┌──────────────────────────────────────┐
│ POST /api/auth/login                 │
│ Returns JWT with:                    │
│ role: "School Admin"                 │
└──────────────────────────────────────┘
                ↓
Step 3: School Admin Tries to Access Features
┌──────────────────────────────────────┐
│ GET /api/school-admin/dashboard      │
│ schoolAdminRoutes.js                 │
│                                      │
│ Middleware checks:                   │
│ if (user.role !== 'school-admin')    │
│     return 403 Forbidden             │
│                                      │
│ 'School Admin' ≠ 'school-admin'      │
│                                      │
│ ❌ ACCESS DENIED!                    │
└──────────────────────────────────────┘
```

## The Solution

```
┌─────────────────────────────────────────────────────────────┐
│ AFTER FIX - School Admin Creation Works                     │
└─────────────────────────────────────────────────────────────┘

Step 1: P2L Admin Creates School Admin
┌──────────────────────────────────────┐
│ POST /p2ladmin/schools/:id/admins    │
│ p2lAdminRoutes.js                    │
│                                      │
│ Creates User with:                   │
│ role: 'school-admin'  ← Hyphen! ✅   │
│ email: admin@school.com              │
│ password: hashed_temp_password       │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│ User Saved to MongoDB                │
│ {                                    │
│   email: "admin@school.com",         │
│   role: "school-admin",              │
│   password: "hash..."                │
│ }                                    │
└──────────────────────────────────────┘

Step 2: School Admin Logs In
┌──────────────────────────────────────┐
│ POST /api/auth/login                 │
│ Returns JWT with:                    │
│ role: "school-admin"                 │
└──────────────────────────────────────┘
                ↓
Step 3: School Admin Accesses Features
┌──────────────────────────────────────┐
│ GET /api/school-admin/dashboard      │
│ schoolAdminRoutes.js                 │
│                                      │
│ Middleware checks:                   │
│ if (user.role !== 'school-admin')    │
│     return 403 Forbidden             │
│                                      │
│ 'school-admin' === 'school-admin'    │
│                                      │
│ ✅ ACCESS GRANTED!                   │
└──────────────────────────────────────┘
```

## Code Changes

### 1. JWT_SECRET Consistency (CRITICAL FIX)

#### mongoP2LRoutes.js & schoolAdminRoutes.js
```javascript
// BEFORE (BROKEN - Different secrets!)
// mongoP2LRoutes.js:
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// schoolAdminRoutes.js:
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// server.js & other routes:
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Result: Tokens signed with one secret couldn't be verified with another ❌

// AFTER (FIXED - Same secret everywhere!)
// ALL FILES NOW USE:
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Result: All routes can verify tokens from any route ✅
```

### 2. User Model (backend/models/User.js)
```javascript
// BEFORE
enum: ['Platform Admin', 'p2ladmin', 'School Admin', 'Teacher', ...]

// AFTER
// Note: 'school-admin' is the standard. 'School Admin' kept for backwards compatibility.
enum: ['Platform Admin', 'p2ladmin', 'School Admin', 'school-admin', 'Teacher', ...]
```

### 2. School Admin Creation (backend/routes/p2lAdminRoutes.js)
```javascript
// BEFORE
const admin = new User({
  name: name || email.split('@')[0],
  email: email.toLowerCase(),
  password: hashedPassword,
  role: 'School Admin',  // ← Wrong!
  schoolId: schoolId,
  // ...
});

// AFTER
const admin = new User({
  name: name || email.split('@')[0],
  email: email.toLowerCase(),
  password: hashedPassword,
  role: 'school-admin',  // ← Fixed! ✅
  schoolId: schoolId,
  // ...
});
```

### 3. Role Normalization (backend/routes/mongoAuthRoutes.js)
```javascript
// BEFORE
if (lower.includes('school')) return 'School Admin';

// AFTER
if (lower.includes('school')) return 'school-admin';
```

### 4. Security Check (backend/routes/schoolAdminRoutes.js)
```javascript
// BEFORE
if (role === 'School Admin') {
  return res.status(403).json({ error: 'Cannot assign school-admin role' });
}

// AFTER
if (role === 'school-admin' || role === 'School Admin') {
  return res.status(403).json({ error: 'Cannot assign school-admin role' });
}
```

## Adaptive Quiz - Already Working ✅

The adaptive quiz question source was already correctly implemented:

```
┌─────────────────────────────────────────────────────────────┐
│ Adaptive Quiz Creation Flow - ALREADY CORRECT               │
└─────────────────────────────────────────────────────────────┘

Step 1: P2L Admin Creates Adaptive Quiz
┌──────────────────────────────────────┐
│ POST /p2ladmin/quizzes/generate-     │
│      adaptive                        │
│                                      │
│ Request:                             │
│ {                                    │
│   title: "Math Quiz",                │
│   difficulty_distribution: {         │
│     1: 10,  // 10 easy questions     │
│     2: 10,  // 10 medium questions   │
│     3: 5    // 5 hard questions      │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
                ↓
Step 2: Query Question Bank (MongoDB)
┌──────────────────────────────────────┐
│ For difficulty 1:                    │
│ Question.find({                      │
│   difficulty: 1,                     │
│   is_active: true                    │
│ })                                   │
│ → Returns all active level 1 Qs     │
│ → Randomly selects 10                │
│                                      │
│ Repeat for difficulty 2, 3...        │
└──────────────────────────────────────┘
                ↓
Step 3: Create Quiz
┌──────────────────────────────────────┐
│ Quiz.create({                        │
│   title: "Math Quiz",                │
│   is_adaptive: true,                 │
│   questions: [                       │
│     { text: "2+2?", difficulty: 1 }, │
│     { text: "3×4?", difficulty: 2 }, │
│     ...                              │
│   ]                                  │
│ })                                   │
│                                      │
│ ✅ Quiz saved with questions from    │
│    question bank!                    │
└──────────────────────────────────────┘
```

## Summary

### What Was Broken:
❌ JWT_SECRET mismatch (authentication failures across routes)
❌ School admin creation (role mismatch)

### What Was Already Working:
✅ Adaptive quiz question source (uses question bank)

### What Was Fixed:
✅ JWT_SECRET now consistent across all 7 backend files
✅ School admin role now uses 'school-admin' consistently
✅ Authentication now works for newly created school admins
✅ Cross-route authentication now works (same token across all routes)
✅ Backwards compatibility maintained with enum dual values
✅ Comprehensive documentation added

### Critical Fixes Detail:

**JWT_SECRET Mismatch Fix:**
- **Files Updated**: mongoP2LRoutes.js, schoolAdminRoutes.js
- **Before**: 2 different default JWT secrets
- **After**: All files use `'dev-secret-change-this-in-production'`
- **Impact**: Tokens now work across all routes

**Role Mismatch Fix:**
- **Files Updated**: User.js, p2lAdminRoutes.js, mongoAuthRoutes.js, schoolAdminRoutes.js
- **Before**: Created with 'School Admin', authenticated with 'school-admin'
- **After**: Standardized on 'school-admin'
- **Impact**: School admins can now login and access features

### What You Need to Do:
1. ✅ Merge this PR
2. ✅ Verify school admin creation works
3. ✅ Verify school admin can login (JWT authentication)
4. ✅ Verify school admin can access school admin features
5. ✅ Add email environment variables in Render (if needed)
6. ✅ Celebrate! 🎉

### Environment Variables Reminder:
In production (Render), **always set** JWT_SECRET environment variable:
```bash
JWT_SECRET=your-strong-random-secret-at-least-32-characters
```

Generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Never rely on default JWT_SECRET values in production!**
