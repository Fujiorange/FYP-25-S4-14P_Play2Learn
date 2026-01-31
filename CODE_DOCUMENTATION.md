# Play2Learn - Code Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Backend Documentation](#backend-documentation)
4. [Frontend Documentation](#frontend-documentation)
5. [Key Features](#key-features)
6. [API Endpoints](#api-endpoints)
7. [Setup and Running](#setup-and-running)
8. [Recent Changes](#recent-changes)

---

## Project Overview

### What is Play2Learn?
Play2Learn is a comprehensive adaptive learning platform designed for K-12 education. It provides personalized learning experiences through adaptive quizzes, progress tracking, and gamification elements. The platform supports multiple user roles including Platform Admins, School Admins, Teachers, Students, and Parents.

### Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: React 19.2.0 with React Router DOM
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Email Service**: Nodemailer
- **File Upload**: Multer
- **CSV Processing**: csv-parser
- **Sentiment Analysis**: Sentiment library (for testimonial moderation)

### Key Technologies
- **Node.js**: v16.0.0 or higher
- **Express**: v4.18.2
- **React**: v19.2.0
- **MongoDB**: v7.0.0
- **Mongoose**: v9.1.3
- **JWT**: jsonwebtoken v9.0.2
- **bcrypt**: v6.0.0

---

## Architecture

### High-Level Architecture
```
Play2Learn/
├── backend/              # Express.js API server
│   ├── models/          # MongoDB Mongoose models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── middleware/      # Authentication & validation
│   ├── utils/           # Utility functions
│   └── server.js        # Main server entry point
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service layer
│   │   └── constants/   # Configuration constants
│   └── public/          # Static assets
│
└── database/            # Database scripts & seeds
```

### Folder Structure

#### Backend Structure
```
backend/
├── models/
│   ├── User.js              # User model (all roles)
│   ├── School.js            # School information
│   ├── Quiz.js              # Quiz definitions
│   ├── Question.js          # Question bank
│   ├── QuizAttempt.js       # Student quiz attempts
│   ├── StudentQuiz.js       # Assigned quizzes
│   ├── StudentProfile.js    # Student learning profiles
│   ├── MathProfile.js       # Math skill tracking
│   ├── MathSkill.js         # Math skill definitions
│   ├── Testimonial.js       # User testimonials
│   ├── LandingPage.js       # Landing page content
│   ├── MaintenanceNotice.js # Maintenance notices
│   └── SupportTicket.js     # Support ticket system
│
├── routes/
│   ├── mongoAuthRoutes.js       # Authentication endpoints
│   ├── mongoStudentRoutes.js    # Student endpoints
│   ├── schoolAdminRoutes.js     # School admin endpoints
│   ├── p2lAdminRoutes.js        # Platform admin endpoints
│   ├── adaptiveQuizRoutes.js    # Adaptive quiz logic
│   └── mongoParentRoutes.js     # Parent endpoints
│
├── services/
│   └── emailService.js      # Email notification service
│
├── middleware/
│   └── (authentication middleware)
│
├── utils/
│   └── passwordGenerator.js # Temporary password generation
│
└── server.js                # Express server configuration
```

#### Frontend Structure
```
frontend/src/
├── components/
│   ├── Auth/                    # Login, Register components
│   ├── Student/                 # Student dashboard & features
│   ├── Teacher/                 # Teacher dashboard & features
│   ├── Parents/                 # Parent dashboard & features
│   ├── SchoolAdmin/             # School admin management
│   ├── P2LAdmin/                # Platform admin tools
│   ├── DynamicLandingPage/      # Landing page
│   ├── Header/                  # Navigation header
│   ├── Footer/                  # Footer component
│   ├── Hero/                    # Hero section
│   ├── Feature/                 # Feature showcase
│   ├── Testimonials/            # Testimonials display
│   ├── Pricing/                 # Pricing plans
│   ├── About/                   # About page
│   ├── Contact/                 # Contact form
│   ├── Roadmap/                 # Product roadmap
│   └── common/                  # Shared components
│
├── services/
│   ├── authService.js           # Authentication API calls
│   ├── studentService.js        # Student API calls
│   ├── parentService.js         # Parent API calls
│   ├── schoolAdminService.js    # School admin API calls
│   └── p2lAdminService.js       # Platform admin API calls
│
└── constants/
    └── (configuration constants)
```

---

## Backend Documentation

### Models

#### 1. User Model (`models/User.js`)
**Purpose**: Manages all user types in the system

**Key Fields**:
- `name`: User's full name
- `email`: Unique email address (lowercase)
- `password`: Hashed password (bcrypt)
- `role`: Enum - 'Platform Admin', 'p2ladmin', 'School Admin', 'Teacher', 'Student', 'Parent', 'Trial Student', 'Trial Teacher'
- `schoolId`: Reference to school (for school-based users)
- `contact`: Phone number
- `gender`: Enum - 'male', 'female', 'other', 'prefer-not-to-say'
- `date_of_birth`: Date of birth
- `profile_picture`: URL or dataURL for profile picture
- `requirePasswordChange`: Boolean flag for first login
- `emailVerified`: Email verification status
- `accountActive`: Account status
- `isTrialUser`: Trial user flag

**Student-Specific Fields**:
- `class`: Student's class/grade
- `gradeLevel`: Academic grade level
- `username`: Display username

**Teacher-Specific Fields**:
- `subject`: Teaching subject

**Parent-Specific Fields**:
- `linkedStudents`: Array of linked student IDs with relationship

#### 2. School Model (`models/School.js`)
**Purpose**: Manages school information and licensing

**Key Fields**:
- `name`: School name
- `address`: School address
- `contact`: Contact information
- `plan_info`: Subscription plan details
  - `plan_name`: Plan tier
  - `student_limit`: Maximum students
  - `teacher_limit`: Maximum teachers
- `current_students`: Current student count
- `current_teachers`: Current teacher count
- `is_active`: School active status
- `created_at`: Creation timestamp

#### 3. Quiz Model (`models/Quiz.js`)
**Purpose**: Defines quiz structure and metadata

**Key Fields**:
- `title`: Quiz title
- `description`: Quiz description
- `subject`: Subject area
- `gradeLevel`: Target grade level
- `questions`: Array of question references
- `duration`: Time limit in minutes
- `totalMarks`: Maximum score
- `passingMarks`: Minimum passing score
- `isAdaptive`: Adaptive quiz flag
- `createdBy`: Creator user ID

#### 4. Question Model (`models/Question.js`)
**Purpose**: Question bank for quizzes

**Key Fields**:
- `questionText`: The question content
- `options`: Array of answer options
- `correctAnswer`: Correct answer index
- `subject`: Subject area
- `topic`: Specific topic
- `difficulty`: 'easy', 'medium', 'hard'
- `gradeLevel`: Target grade level
- `explanation`: Answer explanation
- `skillTags`: Associated skills

#### 5. QuizAttempt Model (`models/QuizAttempt.js`)
**Purpose**: Records student quiz attempts and results

**Key Fields**:
- `studentId`: Student user ID
- `quizId`: Quiz reference
- `answers`: Array of student answers
- `score`: Quiz score
- `percentage`: Score percentage
- `timeSpent`: Time taken
- `completedAt`: Completion timestamp
- `isPassed`: Pass/fail status
- `feedback`: Teacher feedback

#### 6. StudentQuiz Model (`models/StudentQuiz.js`)
**Purpose**: Manages quiz assignments to students

**Key Fields**:
- `studentId`: Assigned student
- `quizId`: Quiz reference
- `teacherId`: Assigning teacher
- `assignedDate`: Assignment date
- `dueDate`: Submission deadline
- `status`: 'assigned', 'in-progress', 'completed'
- `isCompleted`: Completion flag

#### 7. Testimonial Model (`models/Testimonial.js`)
**Purpose**: User testimonials with approval workflow

**Key Fields**:
- `userId`: Testimonial author
- `userName`: Author's name
- `userRole`: Author's role
- `content`: Testimonial text
- `rating`: Star rating (1-5)
- `isApproved`: Approval status
- `isVisible`: Visibility on landing page
- `sentimentScore`: Auto-analyzed sentiment
- `approvedBy`: Approver user ID
- `createdAt`: Creation timestamp

#### 8. LandingPage Model (`models/LandingPage.js`)
**Purpose**: Dynamic landing page content management

**Key Fields**:
- `heroSection`: Hero banner content
  - `title`: Main headline
  - `subtitle`: Subheading
  - `ctaText`: Call-to-action button text
  - `ctaLink`: CTA button link
  - `backgroundImage`: Hero image URL
- `featuresSection`: Features list
- `aboutSection`: About content
- `pricingSection`: Pricing plans
- `testimonialsSection`: Configuration
- `footerSection`: Footer content
- `isActive`: Active status
- `version`: Content version

#### 9. MaintenanceNotice Model (`models/MaintenanceNotice.js`)
**Purpose**: System-wide maintenance and notification messages

**Key Fields**:
- `title`: Notice title
- `message`: Notice content
- `type`: 'info', 'warning', 'maintenance', 'urgent'
- `startDate`: Notice start time
- `endDate`: Notice end time
- `isActive`: Active status
- `targetRoles`: Array of target roles or 'all'
- `createdBy`: Creator user ID

#### 10. SupportTicket Model (`models/SupportTicket.js`)
**Purpose**: Support ticket system for users

**Key Fields**:
- `userId`: Ticket creator
- `subject`: Ticket subject
- `description`: Issue description
- `status`: 'open', 'in-progress', 'resolved', 'closed'
- `priority`: 'low', 'medium', 'high'
- `category`: Issue category
- `assignedTo`: Support agent ID
- `responses`: Array of responses

#### 11. StudentProfile Model (`models/StudentProfile.js`)
**Purpose**: Tracks student learning progress and preferences

**Key Fields**:
- `studentId`: Student reference
- `learningStyle`: Learning preference
- `strengths`: Strong subjects/skills
- `weaknesses`: Areas needing improvement
- `goals`: Learning goals
- `achievements`: Earned achievements

#### 12. MathProfile Model (`models/MathProfile.js`)
**Purpose**: Detailed math skill tracking for adaptive learning

**Key Fields**:
- `studentId`: Student reference
- `skills`: Array of skill proficiency levels
- `currentLevel`: Overall math level
- `masteredSkills`: Completed skills
- `inProgressSkills`: Currently learning

### Routes

#### 1. Authentication Routes (`routes/mongoAuthRoutes.js`)
**Base Path**: `/api/auth`

**Endpoints**:
- `POST /register` - User registration
- `POST /login` - User login (returns JWT token)
- `POST /logout` - User logout
- `POST /change-password` - Change password
- `GET /maintenance-notices` - Get active maintenance notices
- `GET /me` - Get current user profile

**Features**:
- JWT token generation and validation
- Password hashing with bcrypt
- Role normalization
- First login password change requirement
- Maintenance notice retrieval

#### 2. Student Routes (`routes/mongoStudentRoutes.js`)
**Base Path**: `/api/student`

**Key Endpoints**:
- `GET /dashboard` - Student dashboard data
- `GET /profile` - Get student profile
- `PUT /profile` - Update student profile
- `GET /quizzes` - Get assigned quizzes
- `GET /quizzes/:id` - Get quiz details
- `POST /quizzes/:id/attempt` - Submit quiz attempt
- `GET /results` - Get quiz results
- `GET /progress` - Get learning progress
- `GET /leaderboard` - View class leaderboard
- `GET /skill-matrix` - Get skill proficiency matrix
- `POST /testimonials` - Submit testimonial
- `POST /support-tickets` - Create support ticket

#### 3. School Admin Routes (`routes/schoolAdminRoutes.js`)
**Base Path**: `/api/school-admin`

**Key Endpoints**:
- `GET /dashboard` - School admin dashboard stats
- `POST /teachers` - Manually add teacher
- `POST /students` - Manually add student
- `POST /parents` - Manually add parent
- `POST /bulk-upload/teachers` - CSV bulk upload teachers
- `POST /bulk-upload/students` - CSV bulk upload students
- `POST /bulk-upload/parents` - CSV bulk upload parents
- `GET /users` - List all school users
- `DELETE /users/:id` - Remove user
- `POST /users/:id/reset-password` - Reset user password
- `PUT /users/:id/disable` - Disable/enable user account
- `GET /classes` - Get class list
- `POST /classes` - Create new class
- `GET /badges` - Badge management
- `POST /points` - Award points to students

**Features**:
- License limit checking (student/teacher limits)
- Bulk user import via CSV
- Automatic welcome email sending
- Default password: `Admin@123`
- Parent-student linking
- User management (CRUD operations)

#### 4. Platform Admin Routes (`routes/p2lAdminRoutes.js`)
**Base Path**: `/api/p2ladmin`

**Key Endpoints**:
- `POST /register-admin` - Register new platform admin
- `GET /dashboard` - Platform-wide statistics
- `POST /schools` - Create new school
- `GET /schools` - List all schools
- `PUT /schools/:id` - Update school
- `DELETE /schools/:id` - Delete school
- `POST /school-admins/batch` - Batch create school admins
- `GET /questions` - Get question bank
- `POST /questions` - Add new question
- `PUT /questions/:id` - Update question
- `DELETE /questions/:id` - Delete question
- `GET /quizzes` - List all quizzes
- `POST /quizzes` - Create quiz
- `POST /adaptive-quiz` - Create adaptive quiz
- `GET /landing-page` - Get landing page content
- `PUT /landing-page` - Update landing page
- `GET /testimonials` - Get all testimonials
- `PUT /testimonials/:id/approve` - Approve testimonial
- `PUT /testimonials/:id/reject` - Reject testimonial
- `POST /maintenance-notices` - Create maintenance notice
- `GET /maintenance-notices` - List maintenance notices
- `PUT /maintenance-notices/:id` - Update notice
- `DELETE /maintenance-notices/:id` - Delete notice

**Features**:
- Multi-school management
- School admin batch creation with auto-generated passwords
- Question bank management
- Quiz creation (standard and adaptive)
- Landing page CMS
- Testimonial moderation with sentiment analysis
- Maintenance notice system

#### 5. Adaptive Quiz Routes (`routes/adaptiveQuizRoutes.js`)
**Base Path**: `/api/adaptive-quiz`

**Key Endpoints**:
- `POST /start` - Start adaptive quiz session
- `POST /next-question` - Get next question based on performance
- `POST /submit-answer` - Submit answer and update difficulty
- `POST /complete` - Complete adaptive quiz
- `GET /history/:studentId` - Get student's adaptive quiz history

**Features**:
- Dynamic difficulty adjustment
- Skill-based question selection
- Real-time performance tracking
- Personalized learning paths

#### 6. Parent Routes (`routes/mongoParentRoutes.js`)
**Base Path**: `/api/parent`

**Key Endpoints**:
- `GET /dashboard` - Parent dashboard
- `GET /children` - Get linked children
- `GET /children/:id/performance` - View child performance
- `GET /children/:id/progress` - View child progress
- `GET /children/:id/skill-matrix` - View child skill matrix
- `POST /feedback` - Send feedback to teacher
- `GET /announcements` - View school announcements
- `POST /testimonials` - Submit testimonial

### Services

#### Email Service (`services/emailService.js`)
**Purpose**: Handles all email notifications

**Functions**:
- `sendSchoolAdminWelcomeEmail(email, name, password)` - Welcome email for school admins
- `sendTeacherWelcomeEmail(email, name, password)` - Welcome email for teachers
- `sendStudentCredentialsToParent(parentEmail, studentName, username, password)` - Student credentials to parent
- `sendParentWelcomeEmail(email, name, password)` - Welcome email for parents
- `sendPasswordResetEmail(email, resetToken)` - Password reset email

**Configuration**:
- Uses Nodemailer
- Supports SMTP services (Gmail, Outlook, SendGrid, etc.)
- Configurable via environment variables

### Middleware

**Authentication Middleware**:
- Token verification using JWT
- Role-based access control
- School admin verification
- Platform admin verification

### Utilities

**Password Generator** (`utils/passwordGenerator.js`):
- Generates temporary passwords for new users
- Default password: `Admin@123` for school admins

---

## Frontend Documentation

### Component Organization

#### Auth Components (`components/Auth/`)
- Login page
- Registration page
- Admin registration page
- Password change forms

#### Student Components (`components/Student/`)
- **StudentDashboard**: Main student dashboard
- **ViewProfile**: View student profile
- **EditProfile**: Edit profile information
- **UpdatePicture**: Profile picture upload
- **AttemptQuiz**: Quiz taking interface
- **PlacementQuiz**: Initial skill assessment
- **TakeQuiz**: Standard quiz interface
- **QuizResult**: Quiz results display
- **ViewResults**: All quiz results
- **ViewResultHistory**: Historical performance
- **TrackProgress**: Learning progress tracking
- **ViewLeaderboard**: Class rankings
- **DisplaySkillMatrix**: Skill proficiency visualization
- **ViewDetailedSubjectInfo**: Subject-wise analytics
- **AttemptAssignment**: Assignment submission
- **WriteTestimonial**: Submit testimonial
- **ViewAnnouncements**: School announcements
- **ViewRewardShop**: Rewards redemption
- **ViewBadges**: Earned badges
- **CreateSupportTicket**: Support request
- **TrackSupportTicket**: Ticket tracking

#### Teacher Components (`components/Teacher/`)
- **TeacherDashboard**: Main teacher dashboard
- **ViewProfile**: View teacher profile
- **EditProfile**: Edit profile
- **UpdatePicture**: Profile picture upload
- **StudentList**: View all students
- **StudentPerformance**: Individual student analytics
- **StudentLeaderboard**: Class rankings
- **StudentMatrix**: Class skill matrix
- **CreateAssignment**: Create quiz assignment
- **ModifyAssignment**: Edit assignments
- **ViewSubmissions**: Review student submissions
- **TrackCompletion**: Assignment completion tracking
- **CreateFeedback**: Provide student feedback
- **ViewFeedback**: View feedback history
- **Chat**: Chat with parents
- **WriteTestimonial**: Submit testimonial
- **CreateTicket**: Create support ticket
- **TrackTicket**: Track support tickets

#### Parent Components (`components/Parents/`)
- **ParentDashboard**: Main parent dashboard
- **ViewProfile**: View parent profile
- **EditProfile**: Edit profile
- **UpdatePicture**: Profile picture upload
- **ViewChildren**: View linked children
- **ViewChildPerformance**: Child's academic performance
- **ViewChildProgress**: Child's learning progress
- **ViewChildSkillMatrix**: Child's skill proficiency
- **ViewFeedback**: Teacher feedback
- **ChatWithTeacher**: Communication with teachers
- **ViewAnnouncements**: School announcements
- **WriteTestimonial**: Submit testimonial
- **CreateSupportTicket**: Support request
- **TrackSupportTicket**: Ticket tracking

#### School Admin Components (`components/SchoolAdmin/`)
- **SchoolAdminDashboard**: Main admin dashboard
- **ManualAddUser**: Add individual users
- **RemoveUser**: Remove users
- **BulkUploadCSV**: CSV bulk upload
- **ManageClasses**: Class management
- **ProvidePermission**: User permissions
- **ResetPassword**: Password reset
- **DisableUser**: Enable/disable accounts
- **BadgeManagement**: Create and assign badges
- **PointsManagement**: Award points

#### Platform Admin Components (`components/P2LAdmin/`)
- **P2LAdminDashboard**: Platform-wide dashboard
- **SchoolManagement**: Manage schools
- **SchoolAdminManagement**: Manage school admins
- **QuestionBank**: Question bank editor
- **QuizManager**: Quiz creation and management
- **AdaptiveQuizCreator**: Create adaptive quizzes
- **LandingPageManager**: CMS for landing page
- **HealthCheck**: System health monitoring
- **MaintenanceNoticeManager**: Maintenance notice management
- **TestimonialManager**: Testimonial approval

#### Landing Page Components
- **DynamicLandingPage**: Main landing page
- **Hero**: Hero section
- **Feature**: Features showcase
- **Testimonials**: Testimonial display
- **Pricing**: Pricing plans
- **About**: About section
- **Contact**: Contact form
- **Roadmap**: Product roadmap
- **Header**: Navigation header
- **Footer**: Footer

### Services Layer

#### authService.js
**Purpose**: Authentication API calls

**Functions**:
- `register(userData)` - User registration
- `login(email, password)` - User login
- `logout()` - User logout
- `getCurrentUser()` - Get current user
- `changePassword(oldPassword, newPassword)` - Change password
- `getMaintenanceNotices()` - Fetch active notices

#### studentService.js
**Purpose**: Student-related API calls

**Functions**:
- `getDashboard()` - Fetch dashboard data
- `getProfile()` - Get student profile
- `updateProfile(data)` - Update profile
- `getQuizzes()` - Get assigned quizzes
- `submitQuiz(quizId, answers)` - Submit quiz attempt
- `getResults()` - Get quiz results
- `getProgress()` - Get learning progress
- `getLeaderboard()` - Get class rankings
- `getSkillMatrix()` - Get skill proficiency
- `submitTestimonial(data)` - Submit testimonial
- `createSupportTicket(data)` - Create ticket

#### parentService.js
**Purpose**: Parent-related API calls

**Functions**:
- `getDashboard()` - Fetch dashboard data
- `getChildren()` - Get linked children
- `getChildPerformance(childId)` - Get child performance
- `getChildProgress(childId)` - Get child progress
- `getChildSkillMatrix(childId)` - Get child skills
- `sendFeedback(data)` - Send teacher feedback
- `getAnnouncements()` - Get announcements

#### schoolAdminService.js
**Purpose**: School admin API calls

**Functions**:
- `getDashboard()` - Fetch dashboard stats
- `addTeacher(data)` - Add teacher manually
- `addStudent(data)` - Add student manually
- `addParent(data)` - Add parent manually
- `bulkUploadUsers(file, type)` - CSV bulk upload
- `getUsers()` - List all users
- `removeUser(userId)` - Delete user
- `resetPassword(userId)` - Reset user password
- `disableUser(userId, status)` - Disable/enable user
- `getClasses()` - Get classes
- `createClass(data)` - Create class

#### p2lAdminService.js
**Purpose**: Platform admin API calls

**Functions**:
- `getDashboard()` - Platform-wide statistics
- `getSchools()` - List schools
- `createSchool(data)` - Create school
- `updateSchool(id, data)` - Update school
- `deleteSchool(id)` - Delete school
- `batchCreateSchoolAdmins(file)` - Batch create admins
- `getQuestions()` - Get question bank
- `createQuestion(data)` - Add question
- `updateQuestion(id, data)` - Update question
- `deleteQuestion(id)` - Delete question
- `getQuizzes()` - List quizzes
- `createQuiz(data)` - Create quiz
- `getLandingPage()` - Get landing page content
- `updateLandingPage(data)` - Update landing page
- `getTestimonials()` - Get testimonials
- `approveTestimonial(id)` - Approve testimonial
- `rejectTestimonial(id)` - Reject testimonial
- `createMaintenanceNotice(data)` - Create notice
- `getMaintenanceNotices()` - List notices
- `updateMaintenanceNotice(id, data)` - Update notice
- `deleteMaintenanceNotice(id)` - Delete notice

### Routes and Navigation

**Main Routes** (defined in `App.js`):
- `/` - Dynamic landing page
- `/login` - Login page
- `/register` - Registration page
- `/register-admin` - Admin registration

**Student Routes**:
- `/student/dashboard` - Student dashboard
- `/student/profile` - View profile
- `/student/edit-profile` - Edit profile
- `/student/update-picture` - Update picture
- `/student/quizzes` - Quiz list
- `/student/quiz/:id` - Take quiz
- `/student/results` - View results
- `/student/progress` - Track progress
- `/student/leaderboard` - Class leaderboard
- `/student/skill-matrix` - Skill matrix
- `/student/announcements` - Announcements
- `/student/badges` - View badges
- `/student/rewards` - Reward shop

**Teacher Routes**:
- `/teacher/dashboard` - Teacher dashboard
- `/teacher/students` - Student list
- `/teacher/student/:id/performance` - Student performance
- `/teacher/create-assignment` - Create assignment
- `/teacher/assignments` - View assignments
- `/teacher/feedback` - Provide feedback

**Parent Routes**:
- `/parent/dashboard` - Parent dashboard
- `/parent/children` - View children
- `/parent/child/:id/performance` - Child performance
- `/parent/child/:id/progress` - Child progress
- `/parent/announcements` - Announcements

**School Admin Routes**:
- `/school-admin/dashboard` - Admin dashboard
- `/school-admin/add-user` - Add user manually
- `/school-admin/bulk-upload` - CSV upload
- `/school-admin/users` - Manage users
- `/school-admin/classes` - Manage classes

**Platform Admin Routes**:
- `/p2l-admin/dashboard` - Platform dashboard
- `/p2l-admin/schools` - School management
- `/p2l-admin/school-admins` - School admin management
- `/p2l-admin/questions` - Question bank
- `/p2l-admin/quizzes` - Quiz management
- `/p2l-admin/landing-page` - Landing page CMS
- `/p2l-admin/testimonials` - Testimonial moderation
- `/p2l-admin/maintenance-notices` - Maintenance notices
- `/p2l-admin/health-check` - System health

---

## Key Features

### User Roles and Permissions

#### 1. Platform Admin (p2ladmin)
**Capabilities**:
- Manage all schools in the system
- Create and manage school administrators
- Manage global question bank
- Create quizzes (standard and adaptive)
- Moderate testimonials with sentiment analysis
- Update landing page content (CMS)
- Create system-wide maintenance notices
- View platform-wide analytics
- Monitor system health

#### 2. School Admin
**Capabilities**:
- Manage school users (teachers, students, parents)
- Manual user creation
- Bulk CSV user import
- Reset user passwords
- Disable/enable user accounts
- View school dashboard statistics
- Manage classes and sections
- Award badges and points to students
- License management (within school limits)

**Default Credentials**:
- Password: `Admin@123`
- Must change password on first login

#### 3. Teacher
**Capabilities**:
- View and manage assigned students
- Create quiz assignments
- Track assignment completion
- View student performance analytics
- Access class leaderboard
- View skill proficiency matrix
- Provide student feedback
- Chat with parents
- Submit testimonials
- Create support tickets

#### 4. Student
**Capabilities**:
- Take assigned quizzes
- Take placement tests
- View quiz results and history
- Track learning progress
- View skill proficiency matrix
- Access class leaderboard
- View earned badges
- Redeem rewards
- View announcements
- Submit testimonials
- Create support tickets

#### 5. Parent
**Capabilities**:
- View linked children
- Monitor child performance
- Track child progress
- View child skill matrix
- View teacher feedback
- Chat with teachers
- View school announcements
- Submit testimonials
- Create support tickets

### Adaptive Quiz System

**How It Works**:
1. Student starts an adaptive quiz session
2. System presents initial question at medium difficulty
3. Based on answer correctness:
   - Correct → Next question is harder
   - Incorrect → Next question is easier
4. Difficulty adjusts in real-time
5. Quiz adapts to student's skill level
6. Results show personalized skill assessment

**Features**:
- Dynamic difficulty adjustment
- Skill-based question selection
- Real-time performance tracking
- Personalized learning paths
- Detailed analytics on skill proficiency

### Landing Page Management

**Features**:
- Dynamic content management system
- Sections: Hero, Features, About, Pricing, Testimonials, Footer
- Live preview mode
- Version control
- Image upload support
- Customizable call-to-action buttons
- Responsive design

**Editable Sections**:
- Hero section (title, subtitle, CTA, background)
- Features list
- About content
- Pricing plans
- Testimonials configuration
- Footer links and content

### Testimonial System

**Workflow**:
1. User (Student/Teacher/Parent) submits testimonial
2. System performs sentiment analysis
3. Testimonial enters approval queue
4. Platform Admin reviews and approves/rejects
5. Approved testimonials display on landing page

**Features**:
- Automatic sentiment analysis
- Star rating (1-5)
- Approval workflow
- Visibility control
- Role-based filtering
- Spam detection

### Maintenance Notice System

**Features**:
- Create system-wide notices
- Notice types: info, warning, maintenance, urgent
- Scheduled start/end dates
- Target specific roles or all users
- Active/inactive status
- Auto-display during active period
- Real-time notifications

### Password Management

**Security Features**:
- bcrypt password hashing (cost factor: 10)
- JWT token authentication
- Secure token storage
- Password change on first login
- Password reset functionality
- Temporary password generation

**Default Passwords**:
- School Admin: `Admin@123` (must change on first login)
- Teachers (CSV): Auto-generated, sent via email
- Students (CSV): Auto-generated, sent to parent email
- Parents (CSV): Auto-generated, sent via email

### Email Notifications

**Email Types**:
- Welcome emails (School Admin, Teacher, Parent)
- Student credentials to parents
- Password reset emails
- Assignment notifications
- System announcements

**Configuration**:
- SMTP service support (Gmail, Outlook, SendGrid, etc.)
- Configurable sender address
- HTML email templates
- Attachment support

---

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register              # User registration
POST   /api/auth/login                 # User login
POST   /api/auth/logout                # User logout
POST   /api/auth/change-password       # Change password
GET    /api/auth/me                    # Get current user
GET    /api/auth/maintenance-notices   # Get active notices
```

### Student Endpoints
```
GET    /api/student/dashboard          # Dashboard data
GET    /api/student/profile            # Get profile
PUT    /api/student/profile            # Update profile
GET    /api/student/quizzes            # List assigned quizzes
GET    /api/student/quizzes/:id        # Get quiz details
POST   /api/student/quizzes/:id/attempt    # Submit quiz
GET    /api/student/results            # Quiz results
GET    /api/student/progress           # Learning progress
GET    /api/student/leaderboard        # Class rankings
GET    /api/student/skill-matrix       # Skill proficiency
POST   /api/student/testimonials       # Submit testimonial
POST   /api/student/support-tickets    # Create ticket
GET    /api/student/announcements      # View announcements
```

### Teacher Endpoints
```
GET    /api/teacher/dashboard          # Dashboard data
GET    /api/teacher/students           # List students
GET    /api/teacher/students/:id/performance    # Student analytics
POST   /api/teacher/assignments        # Create assignment
GET    /api/teacher/assignments        # List assignments
PUT    /api/teacher/assignments/:id    # Update assignment
DELETE /api/teacher/assignments/:id    # Delete assignment
GET    /api/teacher/submissions        # View submissions
POST   /api/teacher/feedback           # Provide feedback
```

### Parent Endpoints
```
GET    /api/parent/dashboard           # Dashboard data
GET    /api/parent/children            # List linked children
GET    /api/parent/children/:id/performance    # Child performance
GET    /api/parent/children/:id/progress       # Child progress
GET    /api/parent/children/:id/skill-matrix   # Child skills
GET    /api/parent/announcements       # School announcements
POST   /api/parent/feedback            # Send teacher feedback
```

### School Admin Endpoints
```
GET    /api/school-admin/dashboard     # School statistics
POST   /api/school-admin/teachers      # Add teacher
POST   /api/school-admin/students      # Add student
POST   /api/school-admin/parents       # Add parent
POST   /api/school-admin/bulk-upload/teachers    # CSV upload teachers
POST   /api/school-admin/bulk-upload/students    # CSV upload students
POST   /api/school-admin/bulk-upload/parents     # CSV upload parents
GET    /api/school-admin/users         # List all users
DELETE /api/school-admin/users/:id     # Remove user
POST   /api/school-admin/users/:id/reset-password    # Reset password
PUT    /api/school-admin/users/:id/disable    # Disable user
GET    /api/school-admin/classes       # List classes
POST   /api/school-admin/classes       # Create class
```

### Platform Admin Endpoints
```
# Admin Management
POST   /api/p2ladmin/register-admin    # Register platform admin

# School Management
GET    /api/p2ladmin/schools           # List all schools
POST   /api/p2ladmin/schools           # Create school
PUT    /api/p2ladmin/schools/:id       # Update school
DELETE /api/p2ladmin/schools/:id       # Delete school

# School Admin Management
POST   /api/p2ladmin/school-admins/batch    # Batch create school admins

# Question Bank
GET    /api/p2ladmin/questions         # List questions
POST   /api/p2ladmin/questions         # Create question
PUT    /api/p2ladmin/questions/:id     # Update question
DELETE /api/p2ladmin/questions/:id     # Delete question

# Quiz Management
GET    /api/p2ladmin/quizzes           # List quizzes
POST   /api/p2ladmin/quizzes           # Create quiz
POST   /api/p2ladmin/adaptive-quiz     # Create adaptive quiz
PUT    /api/p2ladmin/quizzes/:id       # Update quiz
DELETE /api/p2ladmin/quizzes/:id       # Delete quiz

# Landing Page CMS
GET    /api/p2ladmin/landing-page      # Get landing page
PUT    /api/p2ladmin/landing-page      # Update landing page

# Testimonial Management
GET    /api/p2ladmin/testimonials      # List testimonials
PUT    /api/p2ladmin/testimonials/:id/approve    # Approve
PUT    /api/p2ladmin/testimonials/:id/reject     # Reject

# Maintenance Notices
GET    /api/p2ladmin/maintenance-notices         # List notices
POST   /api/p2ladmin/maintenance-notices         # Create notice
PUT    /api/p2ladmin/maintenance-notices/:id     # Update notice
DELETE /api/p2ladmin/maintenance-notices/:id     # Delete notice
```

### Adaptive Quiz Endpoints
```
POST   /api/adaptive-quiz/start        # Start session
POST   /api/adaptive-quiz/next-question    # Get next question
POST   /api/adaptive-quiz/submit-answer    # Submit answer
POST   /api/adaptive-quiz/complete     # Complete quiz
GET    /api/adaptive-quiz/history/:studentId    # Get history
```

---

## Setup and Running

### Prerequisites
- Node.js v16.0.0 or higher
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/play2learn

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Play2Learn <your-email@gmail.com>"

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server Configuration
PORT=5000

# JWT Secret
JWT_SECRET=your-secret-key-here-change-in-production

# Environment
NODE_ENV=development
```

**Email Configuration Notes**:
1. **Gmail**: Use App Password (not regular password)
   - Enable 2FA on Google account
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Use `EMAIL_PORT=587` and `EMAIL_SECURE=false`

2. **Outlook/Hotmail**:
   - Use `EMAIL_HOST=smtp-mail.outlook.com`
   - Use `EMAIL_PORT=587` and `EMAIL_SECURE=false`

3. **Production (Render)**:
   - Set all environment variables in Render dashboard
   - Use production-ready SMTP service (SendGrid, Mailgun, AWS SES)
   - Set `FRONTEND_URL` to deployed frontend URL

### Installation

#### Install All Dependencies
```bash
npm run install-all
```

Or install separately:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd frontend
npm install
```

### Database Setup

#### Option 1: Local MongoDB
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongo --eval "db.version()"
```

#### Option 2: MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

#### Seed Data (Optional)
```bash
cd backend

# Seed questions
node seed-questions.js

# Create admin user
node create-admin.js
```

### Running the Application

#### Development Mode (Both Servers)
From root directory:
```bash
npm run dev
```
This runs both backend and frontend concurrently.

#### Start Backend Only
```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```
Backend runs on http://localhost:5000

#### Start Frontend Only
```bash
cd frontend
npm start
```
Frontend runs on http://localhost:3000

#### Production Build
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Testing the Setup

1. **Check Backend Health**:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check Database Connection**:
   ```bash
   cd backend
   node test-mongo.js
   ```

3. **Test Email Service**:
   ```bash
   cd backend
   node test-email.js
   ```

4. **Access Frontend**:
   Open browser to http://localhost:3000

### Initial Admin Account

Create your first platform admin:
```bash
cd backend
node create-admin.js
```

Or use the registration endpoint:
```bash
curl -X POST http://localhost:5000/api/p2ladmin/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@play2learn.com",
    "password": "SecurePassword123",
    "name": "Platform Admin"
  }'
```

---

## Recent Changes

### School Admin Batch Creation Route
**Feature**: Batch create school administrators from CSV
**Endpoint**: `POST /api/p2ladmin/school-admins/batch`
**Details**:
- Accepts CSV file upload
- Auto-generates secure passwords
- Sends welcome emails to all admins
- Returns creation status for each admin
- Validates school existence
- Checks for duplicate emails

**CSV Format**:
```csv
name,email,schoolId
John Doe,john@school.com,school123
Jane Smith,jane@school.com,school456
```

### Maintenance Notice Feature
**Feature**: System-wide maintenance and notification system
**Components**:
- Backend Model: `MaintenanceNotice.js`
- Frontend Manager: `MaintenanceNoticeManager.jsx`
- API Routes: Full CRUD operations
- Display Logic: Auto-show during active period

**Capabilities**:
- Create scheduled notices
- Multiple notice types (info, warning, maintenance, urgent)
- Role-based targeting
- Active date range
- Auto-activation/deactivation
- Banner display on dashboard

**Notice Types**:
- `info` - General information
- `warning` - Important warnings
- `maintenance` - Scheduled maintenance
- `urgent` - Critical alerts

### Adaptive Quiz History Fixes
**Feature**: Fixed adaptive quiz history retrieval
**Changes**:
- Corrected database query for quiz attempts
- Fixed student ID referencing
- Improved error handling
- Added proper sorting (newest first)
- Enhanced response formatting

**Endpoint**: `GET /api/adaptive-quiz/history/:studentId`
**Returns**:
- Quiz attempt history
- Scores and percentages
- Time spent
- Completion dates
- Question-level analytics

### Password Management Enhancements
**Feature**: Enhanced password security and management
**Changes**:
- Default password for school admins: `Admin@123`
- Require password change on first login (`requirePasswordChange` flag)
- Auto-generated passwords for CSV imports
- Password strength validation
- Secure password reset flow

### Email Service Improvements
**Feature**: Comprehensive email notification system
**Changes**:
- School admin welcome emails
- Teacher welcome emails with credentials
- Student credentials sent to parent email
- Parent welcome emails
- Support for multiple SMTP providers
- HTML email templates
- Better error handling

### Landing Page CMS Enhancements
**Feature**: Dynamic landing page content management
**Changes**:
- Full CMS for landing page content
- Live preview mode
- Image upload support
- Version control
- Section-wise editing
- Responsive design
- Testimonial integration

### Testimonial Approval Workflow
**Feature**: Testimonial moderation with sentiment analysis
**Changes**:
- Automatic sentiment scoring
- Approval queue for admins
- Approve/reject actions
- Visibility control
- Role-based filtering
- Integration with landing page

### CSV Import Improvements
**Feature**: Enhanced bulk user import
**Changes**:
- Support for Teachers, Students, Parents
- License limit checking
- Email validation
- Duplicate detection
- Parent-student linking
- Welcome email automation
- Detailed import reports

### Frontend Routing Updates
**Feature**: Improved navigation and routing
**Changes**:
- Role-based route protection
- Redirect to appropriate dashboard after login
- 404 page for invalid routes
- Back button support
- Deep linking support

### UI/UX Improvements
**Feature**: Enhanced user interface
**Changes**:
- Responsive design
- Loading states
- Error messages
- Success notifications
- Form validation
- Accessibility improvements
- Mobile-friendly layouts

---

## Development Notes

### Code Style
- ES6+ JavaScript
- Async/await for asynchronous operations
- Mongoose for MongoDB ODM
- RESTful API design
- Component-based React architecture

### Error Handling
- Try-catch blocks for async operations
- Meaningful error messages
- HTTP status codes (200, 400, 401, 403, 404, 500)
- Frontend error boundaries
- Validation at both frontend and backend

### Security Best Practices
- Password hashing with bcrypt
- JWT token authentication
- CORS configuration
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Performance Optimization
- Database indexing
- Pagination for large datasets
- Lazy loading of components
- Image optimization
- Caching strategies
- Efficient queries

### Testing
- Unit tests (to be implemented)
- Integration tests (to be implemented)
- Manual testing procedures
- Test scripts in backend directory

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check MongoDB is running: `brew services list`
- Verify MONGODB_URI in `.env`
- Check network connectivity for cloud MongoDB

**Email Not Sending**
- Verify SMTP credentials
- Check EMAIL_HOST and EMAIL_PORT
- For Gmail, ensure App Password is used
- Check spam folder

**CORS Errors**
- Verify FRONTEND_URL in backend `.env`
- Check CORS configuration in `server.js`
- Ensure origin is in allowed list

**JWT Token Invalid**
- Check JWT_SECRET matches in both environments
- Verify token not expired
- Clear browser cookies/localStorage

**CSV Upload Fails**
- Verify CSV format matches expected structure
- Check file encoding (UTF-8)
- Ensure required fields are present
- Check license limits

### Debug Commands

```bash
# Check MongoDB connection
cd backend && node test-mongo.js

# Test email service
cd backend && node test-email.js

# Check question bank
cd backend && node check-questions.js

# View server logs
cd backend && npm run dev
```

---

## Future Enhancements

### Planned Features
- Real-time chat system
- Video conferencing integration
- Advanced analytics dashboard
- Mobile application (React Native)
- Offline mode support
- Multi-language support
- AI-powered recommendations
- Gamification enhancements
- Parent mobile app
- Integration with LMS platforms

### Under Consideration
- WhatsApp notifications
- SMS alerts
- Social login (Google, Microsoft)
- Content recommendation engine
- Peer-to-peer tutoring
- Virtual classroom
- Assessment analytics AI
- Automated report generation

---

## Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Code review
6. Merge to main

### Commit Message Format
```
type(scope): description

Example:
feat(quiz): add adaptive quiz feature
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
```

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For technical support or questions:
- Email: support@play2learn.com
- Documentation: This file
- Issue Tracker: GitHub Issues (if applicable)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintained By**: Play2Learn Development Team
