# Integrated Module Functionalities - API Documentation

## Overview

This document describes the newly integrated API modules for the Play2Learn platform. These modules provide complete functionality for parent monitoring and platform administration.

## 🆕 New Integrations

### 1. Parent Module (`/api/mongo/parent`)
Complete parent dashboard and child monitoring system.

### 2. Platform Administration Module (`/api/mongo/p2l`)
Comprehensive platform-level administration tools for managing schools, licenses, support tickets, and system resources.

---

## Parent Module API

**Base URL**: `/api/mongo/parent`  
**Authentication**: Required (JWT Bearer Token)  
**Role**: Parent

### Endpoints

#### 1. Get Parent Dashboard
```
GET /api/mongo/parent/dashboard
```

**Description**: Retrieves parent dashboard data including profile and linked students.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "parent": {
    "_id": "parent_id",
    "name": "Parent Name",
    "email": "parent@email.com",
    "linkedStudents": ["student_id_1", "student_id_2"]
  },
  "defaultChild": {
    "_id": "student_id",
    "name": "Student Name",
    "grade": 5
  }
}
```

#### 2. Get Child Statistics
```
GET /api/mongo/parent/child/:studentId/stats
```

**Description**: Retrieves detailed statistics for a specific child.

**Parameters**:
- `studentId` (path): Student ID

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalQuizzes": 45,
    "averageScore": 85.5,
    "totalAssignments": 23,
    "completedAssignments": 20,
    "skillProgress": {
      "addition": 90,
      "subtraction": 85,
      "multiplication": 75
    }
  }
}
```

#### 3. Get Child Activities
```
GET /api/mongo/parent/child/:studentId/activities?limit=10
```

**Description**: Retrieves recent activities for a specific child.

**Parameters**:
- `studentId` (path): Student ID
- `limit` (query, optional): Number of activities to return (default: 10)

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "activities": [
    {
      "type": "quiz_completed",
      "timestamp": "2024-01-15T10:30:00Z",
      "score": 85,
      "subject": "Math"
    },
    {
      "type": "assignment_submitted",
      "timestamp": "2024-01-14T14:20:00Z",
      "assignmentName": "Fractions Practice"
    }
  ]
}
```

#### 4. Get Child Performance
```
GET /api/mongo/parent/child/:studentId/performance
```

**Description**: Retrieves detailed performance data for a specific child.

**Parameters**:
- `studentId` (path): Student ID

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "performance": {
    "overallProgress": 78,
    "quizPerformance": {
      "totalQuizzes": 45,
      "averageScore": 85.5,
      "trend": "improving"
    },
    "skillLevels": [
      {
        "skill": "Addition",
        "level": 3,
        "mastery": 90
      }
    ]
  }
}
```

#### 5. Get Children Summary
```
GET /api/mongo/parent/children/summary
```

**Description**: Retrieves summary data for all linked children.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "children": [
    {
      "studentId": "student_id_1",
      "name": "Child 1",
      "grade": 5,
      "quickStats": {
        "averageScore": 85,
        "activeAssignments": 3,
        "lastActivity": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

---

## Platform Administration Module API

**Base URL**: `/api/mongo/p2l`  
**Authentication**: Each endpoint handles its own authentication (except `/admin-login`)  
**Role**: Platform Admin

**Note**: Unlike other routes that use server-level middleware, P2L routes implement their own `authenticateAdmin` middleware applied per-route. This provides additional security by verifying the `platform-admin` role at the route level.

### Endpoints Overview

#### Authentication

##### 1. Admin Login
```
POST /api/mongo/p2l/admin-login
```

**Description**: Authenticate as platform administrator.

**Request Body**:
```json
{
  "email": "admin@play2learn.com",
  "password": "admin_password"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "_id": "admin_id",
    "email": "admin@play2learn.com",
    "role": "platform-admin"
  }
}
```

##### 2. Admin Logout
```
POST /api/mongo/p2l/admin-logout
```

**Headers**:
```
Authorization: Bearer <token>
```

#### School Management

##### 3. Get All Schools
```
GET /api/mongo/p2l/schools
```

**Description**: Retrieve list of all schools in the platform.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "schools": [
    {
      "_id": "school_id",
      "name": "Springfield Elementary",
      "location": "Springfield",
      "studentCount": 450,
      "licenseCount": 500
    }
  ]
}
```

##### 4. Create School Profile
```
POST /api/mongo/p2l/schools/profile
```

**Description**: Create a new school profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "New School",
  "location": "City Name",
  "adminEmail": "admin@school.com"
}
```

##### 5. Delete School
```
DELETE /api/mongo/p2l/schools/:id
```

**Description**: Remove a school from the platform.

**Parameters**:
- `id` (path): School ID

**Headers**:
```
Authorization: Bearer <token>
```

##### 6. Get School Admins
```
GET /api/mongo/p2l/schools/:id/admins
```

**Description**: Get all administrators for a specific school.

**Parameters**:
- `id` (path): School ID

**Headers**:
```
Authorization: Bearer <token>
```

##### 7. Add School Admin
```
POST /api/mongo/p2l/schools/:id/admins
```

**Description**: Add a new administrator to a school.

**Parameters**:
- `id` (path): School ID

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Admin Name",
  "email": "admin@school.com",
  "password": "secure_password"
}
```

#### License Management

##### 8. Assign Licenses
```
POST /api/mongo/p2l/licenses/assign
```

**Description**: Assign licenses to a school.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "schoolId": "school_id",
  "licenseCount": 100,
  "expiryDate": "2025-12-31"
}
```

##### 9. Get All Licenses
```
GET /api/mongo/p2l/licenses
```

**Description**: Retrieve all license information across platform.

**Headers**:
```
Authorization: Bearer <token>
```

#### Support Ticket Management

##### 10. Get Support Tickets
```
GET /api/mongo/p2l/support/tickets
```

**Description**: Retrieve all support tickets platform-wide.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "tickets": [
    {
      "_id": "ticket_id",
      "subject": "Login Issue",
      "status": "open",
      "priority": "high",
      "createdBy": "user_id",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

##### 11. Update Support Ticket
```
PUT /api/mongo/p2l/support/tickets/:id
```

**Description**: Update a support ticket's status or assign to staff.

**Parameters**:
- `id` (path): Ticket ID

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "status": "in_progress",
  "assignedTo": "admin_id",
  "response": "We are looking into this issue."
}
```

#### System Health & Monitoring

##### 12. Get System Health
```
GET /api/mongo/p2l/system/health
```

**Description**: Get system health metrics and status.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "health": {
    "database": "healthy",
    "uptime": "99.9%",
    "activeUsers": 1234,
    "serverLoad": "normal"
  }
}
```

##### 13. Get Bug Reports
```
GET /api/mongo/p2l/system/bugs
```

**Description**: Retrieve all bug reports.

**Headers**:
```
Authorization: Bearer <token>
```

##### 14. Update Bug Status
```
PUT /api/mongo/p2l/system/bugs/:id
```

**Description**: Update bug status or priority.

**Parameters**:
- `id` (path): Bug ID

**Headers**:
```
Authorization: Bearer <token>
```

#### ML & Analytics

##### 15. Get ML Student Profiles
```
GET /api/mongo/p2l/ml/student-profiles
```

**Description**: Retrieve machine learning-based student profiles and analytics.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "profiles": [
    {
      "studentId": "student_id",
      "learningStyle": "visual",
      "strengthAreas": ["geometry", "algebra"],
      "improvementAreas": ["word_problems"],
      "recommendedDifficulty": 3
    }
  ]
}
```

#### Resource Management

##### 16. Create Subject
```
POST /api/mongo/p2l/resources/subjects
```

**Description**: Create a new subject in the system.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Mathematics",
  "grade": 5,
  "description": "Grade 5 Mathematics"
}
```

##### 17. Create Class
```
POST /api/mongo/p2l/resources/classes
```

**Description**: Create a new class.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "5A Mathematics",
  "grade": 5,
  "schoolId": "school_id"
}
```

##### 18. Assign Subject to Class
```
POST /api/mongo/p2l/resources/assign-subject
```

**Description**: Link a subject to a class.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "classId": "class_id",
  "subjectId": "subject_id"
}
```

##### 19. Assign Teacher to Class
```
POST /api/mongo/p2l/resources/assign-teacher
```

**Description**: Assign a teacher to a class.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "classId": "class_id",
  "teacherId": "teacher_id"
}
```

##### 20. Get Resources Overview
```
GET /api/mongo/p2l/resources/overview
```

**Description**: Get complete overview of all platform resources.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "overview": {
    "totalSchools": 45,
    "totalClasses": 230,
    "totalSubjects": 12,
    "totalTeachers": 150
  }
}
```

---

## Frontend Integration

### Parent Service Usage

The `parentService.js` provides a clean API for frontend components:

```javascript
import parentService from '../services/parentService';

// Get dashboard data
const dashboard = await parentService.getDashboard();

// Get child statistics
const stats = await parentService.getChildStats(studentId);

// Get child activities
const activities = await parentService.getChildActivities(studentId, 20);

// Get child performance
const performance = await parentService.getChildPerformance(studentId);

// Get all children summary
const summary = await parentService.getChildrenSummary();

// Check authentication
const isAuth = parentService.isParentAuthenticated();
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

All protected endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The token is obtained through the login endpoints:
- Parents: `/api/mongo/auth/login` (role: Parent)
- Platform Admins: `/api/mongo/p2l/admin-login` (role: platform-admin)

---

## Testing

Run the integration test to verify all routes are properly loaded:

```bash
cd backend
node test-route-integration.js
```

---

## Notes

1. **Parent Routes**: All parent endpoints verify that the authenticated user has the "Parent" role.
2. **P2L Routes**: All platform admin endpoints verify "platform-admin" role.
3. **Data Access**: Parents can only access data for their linked students.
4. **Rate Limiting**: Consider implementing rate limiting for production deployments.
5. **CORS**: Ensure frontend URLs are added to CORS whitelist in `backend/server.js`.
