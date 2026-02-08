# 📤 CSV Class Upload System

## Quick Start

### For School Administrators

1. Navigate to **School Admin** → **Class Management**
2. Click **📤 Upload CSV** button
3. Download the CSV template
4. Fill in your data following the template format
5. Upload and process your CSV file
6. Review results and confirm

### CSV Template Format

```csv
[Classes]
ClassName,GradeLevel,Subjects
Math Class A,Primary 1,Mathematics

[Teachers]
FullName,Email,Class,Subjects
John Teacher,john@school.edu,Math Class A,Mathematics

[Students]
FullName,Email,Class,GradeLevel,LinkedParentEmail
Alice Student,alice@school.edu,Math Class A,Primary 1,parent@email.com

[Parents]
FullName,Email,LinkedStudentEmail
Alice Parent,parent@email.com,alice@school.edu
```

## Documentation

- **📖 [User Guide](./CSV_UPLOAD_USER_GUIDE.md)** - Complete step-by-step instructions
- **🔒 [Security Summary](./CSV_UPLOAD_SECURITY_SUMMARY.md)** - Security analysis and measures
- **📋 [Implementation Summary](./CSV_UPLOAD_IMPLEMENTATION_SUMMARY.md)** - Technical details

## Features

✅ Bulk create classes and users in one operation  
✅ Support for teachers, students, and parents  
✅ Automatic email notifications with credentials  
✅ Real-time validation before upload  
✅ License limit enforcement  
✅ Rate limiting for security  
✅ Comprehensive error reporting  

## What Gets Created

- **Classes**: New classes with grade levels and subjects
- **Teachers**: New or existing teachers assigned to classes
- **Students**: New students assigned to classes and linked to parents
- **Parents**: New or existing parents linked to students

## Important Notes

- Student emails must be unique (new users only)
- Teacher and parent emails can be existing (they get updated)
- All new users receive welcome emails with temporary passwords
- Maximum 5 uploads per 15 minutes per user
- Files are validated before processing

## Support

For detailed help, see the [User Guide](./CSV_UPLOAD_USER_GUIDE.md) or contact your system administrator.

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** February 8, 2026
