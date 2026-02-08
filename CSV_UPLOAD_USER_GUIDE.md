# CSV Class Upload User Guide

## Overview

The CSV Class Upload feature allows school administrators to bulk create classes, teachers, students, and parents in a single operation. This streamlines the onboarding process and eliminates the need for manual, one-by-one user creation.

## Accessing the Feature

1. Log in as a School Admin
2. Navigate to **School Admin Dashboard**
3. Click on **Class Management** → **Manage Classes**
4. Click the **📤 Upload CSV** button

Alternatively, you can directly navigate to: `/school-admin/classes/upload-csv`

## Step-by-Step Guide

### Step 1: Download the CSV Template

1. Click the **📥 Download CSV Template** button
2. A file named `class-upload-template.csv` will be downloaded
3. Open the file in a spreadsheet application (Excel, Google Sheets, etc.)

### Step 2: Fill in Your Data

The template contains four sections, each starting with a header in square brackets:

#### [Classes] Section
Define your classes with the following columns:
- **ClassName** (Required): Name of the class (e.g., "Math Class A", "Science Lab 1")
- **GradeLevel** (Required): Must be one of: Primary 1, Primary 2, Primary 3, Primary 4, Primary 5, Primary 6
- **Subjects**: Comma-separated list in quotes (e.g., "Mathematics,Science")

Example:
```
[Classes]
ClassName,GradeLevel,Subjects
Math Class A,Primary 1,Mathematics
Science Lab 1,Primary 1,"Mathematics,Science"
```

#### [Teachers] Section
Create teachers and assign them to classes:
- **FullName** (Required): Teacher's full name
- **Email** (Required): Valid email address (must be unique for new teachers)
- **Class** (Required): Single class or comma-separated list in quotes
- **Subjects**: Comma-separated list of subjects they teach

Example:
```
[Teachers]
FullName,Email,Class,Subjects
John Teacher,john.teacher@school.edu,Math Class A,Mathematics
Sarah Science,sarah.science@school.edu,"Math Class A,Science Lab 1",Mathematics
```

**Note:** If a teacher email already exists, they will be updated with the new class assignments.

#### [Students] Section
Create students and assign them to classes:
- **FullName** (Required): Student's full name
- **Email** (Required): Valid email address (must be new/unique)
- **Class** (Required): The class to assign the student to
- **GradeLevel** (Required): Student's grade level
- **LinkedParentEmail**: Parent's email address to link this student to

Example:
```
[Students]
FullName,Email,Class,GradeLevel,LinkedParentEmail
Alice Student,alice.student@school.edu,Math Class A,Primary 1,alice.parent@email.com
Bob Student,bob.student@school.edu,Science Lab 1,Primary 1,bob.parent@email.com
```

**Important:** Student emails must NOT already exist in the system.

#### [Parents] Section
Create parents and link them to students:
- **FullName** (Required): Parent's full name
- **Email** (Required): Valid email address
- **LinkedStudentEmail**: Student email(s) to link to (comma-separated if multiple)

Example:
```
[Parents]
FullName,Email,LinkedStudentEmail
Alice Parent,alice.parent@email.com,alice.student@school.edu
Bob Parent,bob.parent@email.com,bob.student@school.edu
```

**Note:** If a parent email already exists, they will be linked to additional students.

### Step 3: Upload Your CSV File

1. Click **Click to select CSV file** or drag and drop your file
2. The system will automatically validate your file
3. Review the validation results:
   - ✅ **Green box**: Validation successful - shows counts of classes, teachers, students, parents
   - ❌ **Red box**: Validation errors - fix these before uploading

### Step 4: Process the Upload

1. If validation is successful, click **📤 Upload & Process CSV**
2. Wait for processing to complete (may take a few moments for large files)
3. Review the results:
   - **Created counts**: New classes, teachers, students, parents
   - **Updated counts**: Existing teachers and parents with new assignments
   - **Warnings**: Non-critical issues (e.g., "Class already exists")
   - **Errors**: Issues that prevented creation

### Step 5: Complete

1. Click **✅ Done - Go to Class Management** to view your new classes
2. All new users will receive welcome emails with their login credentials

## Important Rules & Limitations

### Email Rules
- **Students**: Must have unique email addresses that don't already exist
- **Teachers**: Can already exist - they'll be assigned to additional classes
- **Parents**: Can already exist - they'll be linked to additional students
- All emails must be valid format (user@domain.com)

### License Limits
- The system enforces your school's teacher and student limits
- Upload will fail if you exceed your licensed capacity
- Current usage is checked before processing

### Rate Limiting
- Maximum 5 CSV uploads per 15 minutes per user
- This prevents abuse and ensures system stability

### CSV Format
- File must be in CSV format (.csv extension)
- Use quotes around values containing commas: `"Math,Science"`
- Section headers must be exact: `[Classes]`, `[Teachers]`, `[Students]`, `[Parents]`

## Tips for Success

1. **Start Small**: Test with a few users first before uploading large batches
2. **Use the Template**: Always start with the downloaded template
3. **Check Spelling**: Class names in different sections must match exactly
4. **Validate First**: Use the automatic validation before uploading
5. **Keep Backups**: Save your CSV file in case you need to re-upload

## Troubleshooting

### "Validation Errors" Message
- Review each error carefully
- Fix errors in your CSV file
- Re-upload the corrected file

### "Student email already exists"
- Check if the student is already in the system
- Use a different email or update via Student Management page

### "Class not found" for Students
- Ensure the class name exactly matches what's in the [Classes] section
- Check for typos and spacing

### "License limit exceeded"
- Contact your system administrator to upgrade your school's plan
- Or remove some users before adding new ones

### Upload Takes Too Long
- Break large files into smaller batches
- Aim for 50-100 users per upload for best performance

## What Happens After Upload?

1. **Classes Created**: New classes appear in Class Management
2. **Users Created**: New teachers, students, and parents are added to the system
3. **Emails Sent**: All new users receive:
   - Welcome email with login credentials
   - Temporary password (must be changed on first login)
   - Link to the platform
4. **Assignments Made**: 
   - Teachers assigned to their classes
   - Students assigned to their classes
   - Parents linked to their children

## Security & Privacy

- All uploaded files are deleted immediately after processing
- Passwords are securely hashed before storage
- Temporary passwords are sent via email only
- All users must change their password on first login
- Rate limiting prevents abuse of the upload feature

## Getting Help

If you encounter issues:
1. Check this guide for troubleshooting tips
2. Review the validation errors carefully
3. Contact your system administrator
4. Create a support ticket via School Admin → Support

---

**Last Updated:** February 8, 2026  
**Version:** 1.0
