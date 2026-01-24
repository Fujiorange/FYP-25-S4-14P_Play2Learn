# Admin Registration Feature

This document describes the admin registration feature implementation for the Play2Learn platform.

## Overview

The admin registration page allows the creation of new Play2Learn (P2L) admin users with secure password hashing and comprehensive validation.

## Features

### Backend (`/api/p2ladmin/register-admin`)

**Endpoint**: `POST /api/p2ladmin/register-admin`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Admin registration successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "role": "p2ladmin"
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Email already registered"
}
```

**Validation Rules**:

1. **Email Validation**:
   - Required field
   - Must be valid email format (RFC 5322 simplified)
   - Must be unique (not already registered)

2. **Password Validation**:
   - Minimum 8 characters
   - At least one letter (a-z, A-Z)
   - At least one number (0-9)
   - At least one special character (!@#$%^&*()_+-=[]{}; ':"\\|,.<>/?)

**Security**:
- Passwords are hashed using bcrypt with 10 salt rounds
- Email addresses are converted to lowercase for consistency
- All inputs are validated and sanitized

### Frontend (`/register_admin`)

**Route**: `http://localhost:3000/register_admin`

**Form Fields**:
1. Email Address (required)
2. Password (required, with strength requirements)
3. Confirm Password (required, must match password)

**Client-Side Validation**:
- Real-time email format validation
- Password strength checking
- Password confirmation matching
- Visual error messages with specific guidance

**UI Features**:
- Password visibility toggle
- Responsive design
- Consistent styling with existing Play2Learn UI
- Clear error messages and success feedback
- Link to login page

## Usage

### For Developers

1. **Starting the Application**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm install
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm install
   npm start
   ```

2. **Testing the Registration**:
   ```bash
   # Using curl
   curl -X POST http://localhost:5000/api/p2ladmin/register-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"newadmin@example.com","password":"SecurePass123!"}'
   ```

3. **Verifying in MongoDB**:
   ```javascript
   // Connect to MongoDB
   db.users.findOne({ email: "newadmin@example.com" })
   
   // Should return user with:
   // - role: "p2ladmin"
   // - password: (hashed string)
   // - emailVerified: true
   // - accountActive: true
   ```

### For End Users

1. Navigate to `/register_admin` in your browser
2. Enter your email address
3. Create a strong password following the requirements:
   - At least 8 characters
   - Include letters, numbers, and special characters
4. Confirm your password
5. Click "Create Admin Account"
6. Upon success, you'll be redirected to the login page

## Testing

### Manual Testing Checklist

- [ ] Invalid email format shows error
- [ ] Weak password (too short) shows error
- [ ] Password without number shows error
- [ ] Password without special char shows error
- [ ] Mismatched passwords show error
- [ ] Duplicate email shows error
- [ ] Valid registration succeeds
- [ ] Password is hashed in database
- [ ] User has role 'p2ladmin'
- [ ] Redirect to login works

### Automated Tests

Frontend tests are located in `/frontend/src/components/RegisterAdminPage.test.js`

Run tests:
```bash
cd frontend
npm test -- RegisterAdminPage.test.js
```

## Security Considerations

### Implemented

✅ **Password Hashing**: Bcrypt with 10 salt rounds
✅ **Input Validation**: Both client and server side
✅ **Email Validation**: RFC 5322 compliant
✅ **Password Strength**: Enforced minimum requirements
✅ **Duplicate Prevention**: Email uniqueness check
✅ **Error Handling**: Proper HTTP status codes

### Recommended for Production

⚠️ **Rate Limiting**: Add express-rate-limit to prevent brute force
⚠️ **CAPTCHA**: Add reCAPTCHA for bot protection
⚠️ **Email Verification**: Implement email confirmation workflow
⚠️ **Admin Approval**: Require existing admin to approve new admins
⚠️ **Audit Logging**: Log all registration attempts
⚠️ **IP Restrictions**: Limit registration to certain IP ranges

## Database Schema

The registered admin is stored in the `users` collection with the following fields:

```javascript
{
  _id: ObjectId,
  name: String,              // Derived from email prefix
  email: String,             // Unique, lowercase
  password: String,          // Bcrypt hashed
  role: "p2ladmin",         // Admin role (equivalent to admin: true)
  emailVerified: Boolean,    // Set to true
  accountActive: Boolean,    // Set to true
  createdAt: Date,
  updatedAt: Date
}
```

## API Integration

To integrate the registration endpoint in your application:

```javascript
import { registerP2LAdmin } from './services/p2lAdminService';

// Register new admin
const result = await registerP2LAdmin({
  email: 'admin@example.com',
  password: 'SecurePass123!'
});

if (result.success) {
  console.log('Admin created:', result.user);
  // Redirect to login
} else {
  console.error('Registration failed:', result.error);
  // Show error to user
}
```

## Troubleshooting

### Common Issues

**Issue**: "Email already registered" error
- **Solution**: Use a different email or delete the existing user from database

**Issue**: Password validation fails
- **Solution**: Ensure password meets all requirements (8+ chars, letter, number, special char)

**Issue**: Cannot connect to backend
- **Solution**: Ensure backend is running on port 5000 and MongoDB is connected

**Issue**: UI doesn't show validation errors
- **Solution**: Check browser console for errors and ensure form submission is working

## Future Enhancements

1. Add email verification workflow
2. Implement rate limiting
3. Add CAPTCHA protection
4. Add admin approval process
5. Implement password reset functionality
6. Add multi-factor authentication (MFA)
7. Add admin role permissions management
8. Implement audit logging

## Contributing

When modifying this feature:

1. Update both frontend and backend validation rules consistently
2. Add tests for new validation rules
3. Update this documentation
4. Run security scans before committing
5. Follow existing code style and patterns

## License

Part of the Play2Learn platform. All rights reserved.
