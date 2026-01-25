# School Admin Registration & Question Bank CSV Upload - Feature Documentation

## Overview
This document describes two new features implemented in the Play2Learn platform:
1. School Admin Account Registration with Temporary Password
2. Question Bank CSV Upload with Answer Selection

## Feature 1: School Admin Registration with Forced Password Change

### Summary
When a P2L Admin creates a school, they can now register a School Admin account. This account is created with a randomly generated temporary password that must be changed on first login.

### Backend Implementation

#### Changes to User Model (`backend/models/User.js`)
- Added `requirePasswordChange` field (Boolean, default: false)
- This flag indicates whether a user must change their password before accessing the system

#### Changes to P2L Admin Routes (`backend/routes/p2lAdminRoutes.js`)
- **Endpoint**: `POST /api/p2ladmin/schools/:id/admins`
- Creates a School Admin account with:
  - Role: 'School Admin'
  - Randomly generated temporary password (format: `SCHxxxx@` where x is hex digit)
  - `requirePasswordChange: true` flag set
  - Linked to the specified school via `schoolId`
- Sends welcome email with temporary credentials
- Returns the temporary password in response for P2L admin to share if email fails

#### Changes to Auth Routes (`backend/routes/mongoAuthRoutes.js`)
1. **Login Endpoint Enhancement**
   - Returns `requirePasswordChange` flag in user object
   - Frontend uses this to prompt password change

2. **New Password Change Endpoint**
   - **Endpoint**: `PUT /api/mongo/auth/change-password`
   - **Request Body**: 
     ```json
     {
       "oldPassword": "current password (optional if requirePasswordChange is true)",
       "newPassword": "new password (minimum 8 characters)"
     }
     ```
   - **Behavior**:
     - If `requirePasswordChange` is true, old password is not required
     - Validates new password meets requirements (min 8 characters)
     - Sets `requirePasswordChange` to false after successful change
   - **Response**: Success message or error

### Frontend Implementation

#### Changes to Login Page (`frontend/src/components/LoginPage.js`)
- Checks `requirePasswordChange` flag after successful login
- If true, displays password change modal instead of routing to dashboard
- After password change, routes user to their dashboard (School Admin)

#### New Component: ChangePassword (`frontend/src/components/Auth/ChangePassword.js`)
- Modal component for password change
- Two modes:
  1. **Required Change** (first-time login): Doesn't require old password
  2. **Optional Change**: Requires current password for security
- Features:
  - Password confirmation field
  - Minimum 8 character validation
  - Password mismatch detection
  - Clear error messages
  - Responsive design

#### Changes to Auth Service (`frontend/src/services/authService.js`)
- Added `changePassword(oldPassword, newPassword)` method
- Updates localStorage to clear `requirePasswordChange` flag after successful change

### User Flow

1. **P2L Admin** creates a school
2. **P2L Admin** creates a School Admin for that school
   - System generates temporary password (e.g., `SCH4a2b@`)
   - Email sent to School Admin with credentials
   - P2L Admin can also see the password in response
3. **School Admin** receives email with temporary credentials
4. **School Admin** logs in with email and temporary password
5. System detects `requirePasswordChange: true`
6. **Password Change Modal** appears automatically
7. **School Admin** enters new password (twice for confirmation)
8. System validates and saves new password
9. `requirePasswordChange` flag is set to false
10. **School Admin** is routed to School Admin dashboard

### Security Features
- Passwords are hashed with bcrypt (10 salt rounds)
- Temporary passwords are randomly generated with special characters
- Old password verification for regular password changes
- Minimum password length enforcement (8 characters)
- Password confirmation to prevent typos

---

## Feature 2: Question Bank CSV Upload

### Summary
P2L Admins can now bulk upload questions via CSV file. The question form also now uses a dropdown to select the correct answer from available choices, ensuring accuracy.

### Backend Implementation

#### Changes to P2L Admin Routes (`backend/routes/p2lAdminRoutes.js`)
- Added multer and csv-parser imports
- Configured multer for file uploads (destination: `uploads/`)
- **New Endpoint**: `POST /api/p2ladmin/questions/upload-csv`
  - Accepts CSV file via multipart/form-data
  - Parses CSV with flexible header names (case-insensitive)
  - Supports multiple choice formats:
    - Comma-separated in `choices` column
    - Individual columns: `choice1`, `choice2`, `choice3`, etc.
  - Validates required fields (text, answer)
  - Creates questions with proper metadata
  - Returns detailed results including success/failure counts
  - Handles errors gracefully with line-by-line error reporting

### CSV Format

#### Required Columns
- `text` or `question` - The question text
- `answer` or `correct answer` - The correct answer

#### Optional Columns
- `choice1`, `choice2`, `choice3`, `choice4` - Individual answer choices
- `choices` - Comma-separated answer choices
- `difficulty` - Number from 1-5 (default: 3)
- `subject` - Subject name (default: "General")
- `topic` - Topic name (default: "")
- `is_active` - Boolean, whether question is active (default: true)

#### Sample CSV
```csv
text,choice1,choice2,choice3,choice4,answer,difficulty,subject,topic
"What is 2 + 2?","2","3","4","5","4",1,"Math","Addition"
"What is the capital of France?","London","Berlin","Paris","Rome","Paris",2,"Geography","Capitals"
"Which planet is closest to the sun?","Venus","Mars","Mercury","Earth","Mercury",3,"Science","Solar System"
```

### Frontend Implementation

#### Changes to Question Bank Component (`frontend/src/components/P2LAdmin/QuestionBank.js`)

1. **CSV Upload UI**
   - New "Upload CSV" button in header
   - Upload modal with:
     - CSV format instructions
     - Template download button
     - File selection
     - Upload progress indicator
     - Detailed result display (success/error counts)
     - Error details with line numbers

2. **Answer Selection Enhancement**
   - Changed answer input from text field to dropdown
   - Dropdown automatically populated with available choices
   - Falls back to text input if no choices defined
   - Ensures accuracy by preventing typos in answers
   - Helper text guides users to add choices first

3. **Template Download**
   - One-click download of sample CSV template
   - Pre-filled with example questions
   - Demonstrates proper formatting

#### Changes to P2L Admin Service (`frontend/src/services/p2lAdminService.js`)
- Added `uploadQuestionsCSV(file)` function
- Handles multipart form data upload
- Returns parsed response with success/error details

#### CSS Enhancements (`frontend/src/components/P2LAdmin/QuestionBank.css`)
- Styles for upload modal
- Info box styling for instructions
- File input custom styling
- Success/error result displays
- Responsive layout for upload interface

### User Flow

1. **P2L Admin** clicks "Upload CSV" button in Question Bank
2. Modal displays with format instructions
3. **P2L Admin** optionally downloads template to see format
4. **P2L Admin** prepares CSV file with questions
5. **P2L Admin** selects CSV file
6. **P2L Admin** clicks "Upload CSV"
7. System processes file:
   - Validates format
   - Parses questions
   - Creates database records
   - Tracks successes and failures
8. Results displayed:
   - Total questions processed
   - Successfully created count
   - Failed count with error details
9. Question list automatically refreshes
10. **P2L Admin** can review uploaded questions

### Error Handling
- File type validation (must be .csv)
- Line-by-line error tracking
- Detailed error messages with line numbers
- Partial success support (continues on errors)
- File cleanup after processing
- User-friendly error display

### Benefits
1. **Bulk Import**: Upload hundreds of questions at once
2. **Accuracy**: Dropdown selection prevents answer typos
3. **Efficiency**: Much faster than manual entry
4. **Template**: Easy to get started with provided template
5. **Error Recovery**: Detailed errors help fix issues quickly
6. **Validation**: Ensures data integrity before saving

---

## Testing Instructions

### Testing School Admin Registration

1. **Setup**
   - Ensure MongoDB is running
   - Start backend server: `cd backend && npm start`
   - Start frontend: `cd frontend && npm start`

2. **Create School**
   - Login as P2L Admin
   - Navigate to School Management
   - Create a new school

3. **Create School Admin**
   - Click on the school
   - Click "Create School Admin"
   - Enter email and name
   - Submit form
   - Note the temporary password displayed

4. **Test First Login**
   - Logout
   - Login with school admin email and temporary password
   - Verify password change modal appears
   - Enter new password (twice)
   - Verify successful redirect to School Admin dashboard

5. **Verify Password Changed**
   - Logout
   - Login with new password
   - Verify no password change prompt
   - Verify access to School Admin dashboard

### Testing CSV Upload

1. **Prepare Test File**
   - Use `/tmp/sample_questions.csv` or create your own
   - Ensure proper CSV format with headers

2. **Upload Questions**
   - Login as P2L Admin
   - Navigate to Question Bank
   - Click "Upload CSV"
   - Download template (optional)
   - Select your CSV file
   - Click "Upload CSV"
   - Verify success message with counts

3. **Verify Questions**
   - Check that questions appear in the list
   - Verify all fields are correct
   - Check choices and answers match

4. **Test Answer Selection**
   - Click "Create Question"
   - Add some choices
   - Verify answer field becomes a dropdown
   - Select answer from dropdown
   - Submit and verify

5. **Test Error Handling**
   - Upload invalid CSV (wrong format)
   - Upload CSV with missing required fields
   - Verify appropriate error messages
   - Verify partial success handling

---

## API Documentation

### School Admin Endpoints

#### Create School Admin
```
POST /api/p2ladmin/schools/:id/admins
Authorization: Bearer <p2ladmin-token>
Content-Type: application/json

Request Body:
{
  "email": "admin@school.com",
  "name": "John Doe" (optional)
}

Response:
{
  "success": true,
  "message": "School admin created successfully",
  "data": {
    "id": "user_id",
    "email": "admin@school.com",
    "name": "John Doe",
    "role": "School Admin",
    "tempPassword": "SCH4a2b@"
  }
}
```

### Password Change Endpoint

#### Change Password
```
PUT /api/mongo/auth/change-password
Authorization: Bearer <user-token>
Content-Type: application/json

Request Body:
{
  "oldPassword": "current_password" (optional if requirePasswordChange is true),
  "newPassword": "new_password_min_8_chars"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Question Upload Endpoint

#### Upload Questions CSV
```
POST /api/p2ladmin/questions/upload-csv
Authorization: Bearer <p2ladmin-token>
Content-Type: multipart/form-data

Form Data:
file: <csv-file>

Response:
{
  "success": true,
  "message": "Successfully uploaded 5 questions",
  "data": {
    "total": 5,
    "successful": 5,
    "failed": 0,
    "errors": []
  }
}
```

---

## Security Considerations

1. **Password Security**
   - All passwords hashed with bcrypt
   - Temporary passwords use cryptographically secure random generation
   - Minimum password length enforced
   - Password change required on first login for school admins

2. **Access Control**
   - Only P2L Admins can create school admins
   - Only authenticated users can change their password
   - School admin creation requires valid school ID
   - CSV upload restricted to P2L Admins

3. **Data Validation**
   - Email format validation
   - Password strength validation
   - CSV data validation before database insertion
   - Role validation against enum values

4. **Error Handling**
   - Sensitive information not exposed in error messages
   - File cleanup after CSV processing
   - Database transaction safety
   - Graceful degradation on email failures

---

## Future Enhancements

1. **Password Policy**
   - Configurable password requirements
   - Password complexity rules
   - Password history to prevent reuse

2. **CSV Upload**
   - Support for images in questions
   - Bulk update existing questions
   - Import validation preview before saving
   - Support for more question types

3. **School Admin Management**
   - Multiple admins per school
   - Admin role permissions
   - Audit log for admin actions
   - Self-service password reset

4. **Notifications**
   - SMS notifications for temp passwords
   - In-app notifications for password changes
   - Email templates customization
