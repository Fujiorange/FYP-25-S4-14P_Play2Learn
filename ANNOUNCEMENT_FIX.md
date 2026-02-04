# Announcement Loading Fix - Testing Guide

## Problem Fixed
Students, teachers, and parents were getting "Error: Failed to load announcements. Please try again." when trying to view school announcements.

## Root Cause
The User model stores `schoolId` as a **String** type:
```javascript
schoolId: { type: String, default: null }
```

But the Announcement model stores `schoolId` as an **ObjectId** type:
```javascript
schoolId: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'School',
  required: true
}
```

When querying announcements with a String schoolId, MongoDB couldn't match it against the ObjectId schoolId in the announcements collection, resulting in no results and query failures.

## Solution
Convert the String schoolId to an ObjectId before querying announcements using:
```javascript
const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
```

## Files Modified
1. `backend/routes/mongoStudentRoutes.js` - GET /announcements endpoint
2. `backend/routes/mongoTeacherRoutes.js` - GET /announcements endpoint
3. `backend/routes/mongoParentRoutes.js` - GET /announcements endpoint
4. `backend/routes/schoolAdminRoutes.js` - GET, POST, PUT, DELETE /announcements endpoints

## How to Test

### Prerequisites
1. MongoDB running with test data
2. Backend server running: `cd backend && npm start`
3. At least one school created
4. At least one announcement created by school admin
5. Test users (student, teacher, parent) with schoolId set

### Manual Testing

#### Test 1: Student View Announcements
1. Login as a student
2. Navigate to `/student/announcements`
3. **Expected**: Announcements are displayed (no error message)
4. **Before Fix**: "Error: Failed to load announcements. Please try again."

#### Test 2: Teacher View Announcements
1. Login as a teacher
2. Navigate to `/teacher/announcements`
3. **Expected**: Announcements are displayed

#### Test 3: Parent View Announcements
1. Login as a parent
2. Navigate to `/parent/announcements`
3. **Expected**: Announcements are displayed

#### Test 4: School Admin Create/View/Edit/Delete
1. Login as school admin
2. Create a new announcement
3. **Expected**: Announcement appears in the list
4. Edit the announcement
5. **Expected**: Changes are saved
6. Delete the announcement
7. **Expected**: Announcement is removed

### API Testing with curl

```bash
# 1. Login as student and get token
TOKEN=$(curl -X POST http://localhost:5000/api/mongo/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Get announcements (should work now)
curl -X GET http://localhost:5000/api/mongo/student/announcements \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# Expected response:
# {
#   "success": true,
#   "announcements": [
#     {
#       "_id": "...",
#       "title": "...",
#       "content": "...",
#       "priority": "info",
#       "audience": "all",
#       "schoolId": "...",
#       ...
#     }
#   ]
# }
```

## Technical Details

### Before Fix
```javascript
const filter = {
  schoolId: schoolId,  // String value
  ...
};
const announcements = await Announcement.find(filter);
// Result: [] (no matches because String != ObjectId)
```

### After Fix
```javascript
const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
const filter = {
  schoolId: schoolObjectId,  // ObjectId value
  ...
};
const announcements = await Announcement.find(filter);
// Result: [...] (matches found!)
```

## Impact
- ✅ Students can now view school announcements
- ✅ Teachers can now view school announcements
- ✅ Parents can now view announcements from their children's schools
- ✅ School admins can reliably create, view, edit, and delete announcements
- ✅ Consistent ObjectId handling across all announcement operations

## Notes
- Mongoose automatically converts String to ObjectId when **saving** documents (if schema specifies ObjectId)
- Mongoose does NOT automatically convert String to ObjectId when **querying** documents
- This is why announcements could be created but not retrieved
- The fix adds explicit conversion for all query operations
