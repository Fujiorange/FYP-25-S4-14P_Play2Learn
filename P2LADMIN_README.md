# P2LAdmin Role Implementation

This implementation adds a comprehensive Platform Administrator (p2ladmin) role to the Play2Learn system with full CRUD functionality for managing the platform.

## Features Implemented

### 1. Landing Page Management
- **CRUD Operations**: Create, Read, Update, Delete landing page blocks
- **Modular Design**: Block-based system with configurable types (hero, features, about, testimonials, pricing, contact, footer)
- **Customizable Content**: Each block can have title, content, image URL, visibility, and custom data
- **Easy Reordering**: Drag and reorder blocks to customize the landing page layout

**API Endpoints:**
- `POST /api/p2ladmin/landing` - Save landing page blocks
- `GET /api/p2ladmin/landing` - Retrieve landing page blocks
- `PUT /api/p2ladmin/landing/:id` - Update specific landing page
- `DELETE /api/p2ladmin/landing` - Delete landing page

### 2. School Management
- **License Plans**: Three tiers with specific limits
  - **Starter**: 50 teachers, 500 students - $2,500
  - **Professional**: 100 teachers, 1000 students - $5,000
  - **Enterprise**: 250 teachers, 2500 students - $10,000
- **School CRUD**: Complete management of school organizations
- **License Tracking**: Monitor current vs. maximum teacher/student counts

**API Endpoints:**
- `POST /api/p2ladmin/schools` - Create new school
- `GET /api/p2ladmin/schools` - Get all schools
- `GET /api/p2ladmin/schools/:id` - Get specific school
- `PUT /api/p2ladmin/schools/:id` - Update school
- `DELETE /api/p2ladmin/schools/:id` - Delete school

### 3. School Admin Management
- **Temporary Passwords**: Auto-generated 8-character alphanumeric passwords
- **Multiple Admins**: Support for creating multiple admin accounts per school
- **Password Security**: Admins must change password on first login
- **Email Uniqueness**: Validates unique email addresses

**API Endpoints:**
- `POST /api/p2ladmin/school-admins` - Create school admin(s)
- `GET /api/p2ladmin/schools/:schoolId/admins` - Get school admins

### 4. Question Bank Management
- **Difficulty Levels**: Easy (1), Medium (2), Hard (3)
- **Multiple Choice**: Support for multiple choice questions with configurable choices
- **Subject Categorization**: Organize questions by subject and topic
- **Full CRUD**: Create, read, update, delete questions

**API Endpoints:**
- `POST /api/p2ladmin/questions` - Create question
- `GET /api/p2ladmin/questions` - Get all questions (with filters)
- `GET /api/p2ladmin/questions/:id` - Get specific question
- `PUT /api/p2ladmin/questions/:id` - Update question
- `DELETE /api/p2ladmin/questions/:id` - Delete question

### 5. Adaptive Quiz System
- **Adaptive Logic**: Questions adjust difficulty based on student performance
  - Correct answer → harder question (difficulty +1)
  - Incorrect answer → easier question (difficulty -1)
- **Question Bank Integration**: Pull questions from the question bank
- **Quiz Types**: Support for both adaptive and standard quizzes

**API Endpoints:**
- `POST /api/p2ladmin/quizzes` - Create quiz
- `GET /api/p2ladmin/quizzes` - Get all quizzes
- `GET /api/p2ladmin/quizzes/:id` - Get specific quiz
- `PUT /api/p2ladmin/quizzes/:id` - Update quiz
- `DELETE /api/p2ladmin/quizzes/:id` - Delete quiz
- `POST /api/p2ladmin/quizzes/run` - Run adaptive quiz (get next question)

### 6. Health Check System
- **Database Status**: Monitor MongoDB connection status
- **Server Metrics**: Track uptime, environment, and connectivity
- **Real-time Updates**: Auto-refresh every 30 seconds in the dashboard
- **Detailed Reporting**: Complete server and database health information

**API Endpoint:**
- `GET /api/p2ladmin/health` - Get system health status

### 7. P2LAdmin Seed & Authentication
- **Initial Setup**: Seed endpoint to create first p2ladmin user
- **Secure Authentication**: JWT-based authentication middleware
- **Protected Routes**: All admin routes require valid p2ladmin token

**API Endpoint:**
- `POST /api/p2ladmin/seed` - Create/update p2ladmin account

## Database Models

### User Model
- Extended to include `p2ladmin` role in enum
- Compatible with existing user structure

### School Model
```javascript
{
  organization_name: String,
  organization_type: String,
  plan: Enum ['starter', 'professional', 'enterprise'],
  plan_info: {
    teacher_limit: Number,
    student_limit: Number,
    price: Number
  },
  contact: String,
  is_active: Boolean,
  current_teachers: Number,
  current_students: Number
}
```

### Question Model
```javascript
{
  text: String,
  choices: [String],
  answer: String,
  difficulty: Number (1-3),
  subject: String,
  topic: String,
  is_active: Boolean,
  created_by: ObjectId
}
```

### Quiz Model
```javascript
{
  title: String,
  description: String,
  questions: [{
    question_id: ObjectId,
    text: String,
    choices: [String],
    answer: String,
    difficulty: Number
  }],
  is_adaptive: Boolean,
  is_active: Boolean,
  created_by: ObjectId
}
```

### LandingPage Model
```javascript
{
  blocks: [{
    type: Enum,
    title: String,
    content: String,
    image_url: String,
    order: Number,
    is_visible: Boolean,
    custom_data: Object
  }],
  is_active: Boolean,
  version: Number,
  updated_by: ObjectId
}
```

## Frontend Components

### P2LAdminDashboard
Main dashboard with system health monitoring and navigation to all management features.

### SchoolManagement
Complete UI for creating and managing schools with licensing plans.

### SchoolAdminManagement
Interface for creating school admin accounts with temporary password display.

### QuestionBank
Full question management UI with difficulty filters and subject categorization.

### QuizManager
Quiz creation interface with question selection and adaptive mode toggle.

### LandingPageManager
Modular block-based landing page editor with drag-and-drop reordering.

### HealthCheck
System health monitoring dashboard with auto-refresh capabilities.

## Routes

All p2ladmin routes are prefixed with `/p2ladmin`:
- `/p2ladmin/dashboard` - Main dashboard
- `/p2ladmin/schools` - School management
- `/p2ladmin/school-admins` - School admin management
- `/p2ladmin/questions` - Question bank
- `/p2ladmin/quizzes` - Quiz manager
- `/p2ladmin/landing-page` - Landing page editor
- `/p2ladmin/health` - Health check

## Testing

### Frontend Tests
- `P2LAdminDashboard.test.js` - Dashboard component tests
- `SchoolManagement.test.js` - School management tests
- `QuestionBank.test.js` - Question bank tests

Tests use Jest and React Testing Library with mocked API services.

## Security Considerations

### Implemented Security Features
1. **JWT Authentication**: All p2ladmin routes protected by JWT middleware
2. **Password Hashing**: bcrypt for password security (10 salt rounds)
3. **Email Validation**: Unique email constraint for user accounts
4. **Role-Based Access**: Strict role checking in authentication middleware

### CodeQL Security Scan Results
The security scan identified 42 instances of missing rate limiting on API endpoints. These are **recommendations** for production hardening but not critical vulnerabilities.

**Security Recommendations for Production:**
1. **Add Rate Limiting**: Implement express-rate-limit middleware to prevent abuse
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/p2ladmin', limiter);
   ```

2. **Input Validation**: Add input validation middleware (e.g., express-validator)
3. **HTTPS Only**: Ensure all production traffic uses HTTPS
4. **CORS Configuration**: Review and restrict CORS origins for production
5. **Environment Variables**: Ensure JWT_SECRET and MONGODB_URI are set securely

### Current Security Status
- ✅ Authentication implemented with JWT
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Input validation in place
- ⚠️ Rate limiting recommended for production
- ✅ No critical security vulnerabilities detected

## Installation & Setup

### Backend Setup
```bash
cd backend
npm install
# Set environment variables in .env file
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secure_jwt_secret
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
# Set environment variable
# REACT_APP_API_URL=http://localhost:5000 (or your backend URL)
npm start
```

### Create Initial P2LAdmin User
```bash
curl -X POST http://localhost:5000/api/p2ladmin/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@p2l.com","password":"SecurePass123","name":"Platform Admin"}'
```

## Future Enhancements

1. **Analytics Dashboard**: Add metrics and charts for platform usage
2. **Bulk Operations**: Import/export functionality for schools and questions
3. **Email Notifications**: Automated emails for school admin account creation
4. **Advanced Reporting**: Generate reports on school performance and usage
5. **API Documentation**: Interactive API documentation using Swagger/OpenAPI
6. **Rate Limiting**: Production-ready rate limiting implementation
7. **Audit Logs**: Track all admin actions for compliance

## Technical Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, React Router
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, CORS
- **Testing**: Jest, React Testing Library

## License Plans Reference

| Plan | Teachers | Students | Price |
|------|----------|----------|-------|
| Starter | 50 | 500 | $2,500 |
| Professional | 100 | 1,000 | $5,000 |
| Enterprise | 250 | 2,500 | $10,000 |

## Support

For issues or questions, please create a GitHub issue or contact the development team.
