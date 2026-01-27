# Complete Render Deployment Guide for Play2Learn

## Issues Fixed in This Update

### 1. ✅ School Admin Creation - FIXED
**Problem**: School admin accounts could not be created successfully.

**Root Cause**: Role naming inconsistency
- The system created school admins with role `'School Admin'` (with space)
- But authentication middleware checked for role `'school-admin'` (with hyphen)
- This mismatch caused authentication failures for newly created school admins

**Solution**: Standardized on `'school-admin'` format
- Updated User model to support both variants during migration
- Changed creation logic to use `'school-admin'`
- Updated all authentication checks to use `'school-admin'`

### 2. ✅ Adaptive Quiz Question Source - VERIFIED WORKING
**Question**: Does adaptive quiz use questions from the question bank?

**Answer**: YES! The adaptive quiz already correctly uses the Question model from the question bank.

**How it works**:
- Route: `/p2ladmin/quizzes/generate-adaptive` in `p2lAdminRoutes.js`
- Queries the MongoDB `Question` collection by difficulty level (1-5)
- Only selects active questions (`is_active: true`)
- Randomly selects the requested number of questions per difficulty
- Creates an adaptive quiz with intelligent difficulty progression

**No changes were needed** - this functionality is working as designed.

---

## Complete Environment Variables for Render

Below is the **complete list** of environment variables you should have configured in your Render dashboard:

### 1. Core Application (REQUIRED)

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/play2learn?retryWrites=true&w=majority

# JWT Secret for authentication tokens
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-random-secret-key-at-least-32-characters-long

# Environment mode
NODE_ENV=production
```

### 2. Email Service (REQUIRED for user account creation)

Choose one of these SMTP providers:

#### Option A: Gmail (Recommended for testing)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Use App Password, not regular password
EMAIL_FROM=Play2Learn <your-email@gmail.com>
```

**Gmail Setup Steps**:
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password (16 characters)
4. Use that App Password as `EMAIL_PASSWORD`

#### Option B: SendGrid (Recommended for production)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxx  # Your SendGrid API key
EMAIL_FROM=Play2Learn <noreply@yourdomain.com>
```

#### Option C: Outlook
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=Play2Learn <your-email@outlook.com>
```

### 3. Frontend Configuration (REQUIRED)

```bash
# Your deployed frontend URL (used in email links)
FRONTEND_URL=https://your-frontend-app.onrender.com
```

### 4. Optional (Server Port)

```bash
# Server port (Render automatically sets this, but you can override)
PORT=5000
```

---

## Step-by-Step Render Configuration

### Step 1: Configure Backend Service

1. Log into your Render dashboard
2. Select your **backend** service
3. Go to the **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add each variable from the list above
6. Click **"Save Changes"**

### Step 2: Configure Frontend Service (if separate)

1. Select your **frontend** service
2. Go to the **"Environment"** tab
3. Add any frontend-specific variables (e.g., API URL pointing to your backend)
4. Click **"Save Changes"**

### Step 3: Verify Deployment

After saving, Render will automatically redeploy your services. Check the logs:

**What to look for**:
```
✅ Email service ready
✅ MongoDB connected successfully
✅ Server running on port 5000
```

**What NOT to see**:
```
❌ Email service error: ECONNREFUSED 127.0.0.1:587
❌ JWT_SECRET warning in production
❌ MongoDB connection failed
```

---

## Testing Your Deployment

### Test 1: School Admin Creation

1. Log in as P2L Admin to: `https://your-app.onrender.com/p2ladmin`
2. Go to **School Management**
3. Select a school and create a new school admin
4. Verify:
   - ✅ Admin account is created successfully
   - ✅ Welcome email is sent (check email inbox)
   - ✅ Admin can log in with temporary password
   - ✅ Admin has access to school admin features

### Test 2: Adaptive Quiz

1. Log in as P2L Admin
2. Go to **Question Bank** at `/p2ladmin/questions`
3. Verify you have questions at different difficulty levels (1-5)
4. Go to **Quiz Management** at `/p2ladmin/quizzes`
5. Click **"Create Adaptive Quiz"**
6. Configure difficulty distribution (e.g., 10 questions each at levels 1-3)
7. Verify:
   - ✅ Quiz is created successfully
   - ✅ Quiz uses questions from the question bank
   - ✅ Students can take the adaptive quiz
   - ✅ Difficulty adjusts based on performance

### Test 3: Email Functionality

1. Create a new teacher/student account
2. Verify:
   - ✅ Welcome email is received
   - ✅ Email contains correct credentials
   - ✅ Login link points to production URL (not localhost)
   - ✅ User can log in successfully

---

## Common Issues & Solutions

### Issue 1: "Email service error: ECONNREFUSED 127.0.0.1:587"

**Cause**: `EMAIL_HOST` is set to localhost or not set at all

**Solution**:
- Verify `EMAIL_HOST` is set to a real SMTP server (e.g., `smtp.gmail.com`)
- Make sure all email variables are saved in Render
- Redeploy the service after saving

### Issue 2: "Invalid login" for SMTP

**Cause**: Wrong credentials or 2FA not configured (for Gmail)

**Solution**:
- **For Gmail**: Use App Password, not your regular password
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- For SendGrid, make sure `EMAIL_USER` is set to `apikey`

### Issue 3: School admin creation fails

**Cause**: This was the bug we just fixed!

**Solution**: 
- Pull the latest code changes (already included in this PR)
- The role inconsistency has been resolved
- New school admins will be created with the correct `'school-admin'` role

### Issue 4: JWT_SECRET warning in production

**Cause**: Using default JWT_SECRET or no JWT_SECRET set

**Solution**:
- Generate a strong secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Set `JWT_SECRET` environment variable in Render
- Redeploy

### Issue 5: Adaptive quiz has no questions

**Cause**: Question bank is empty

**Solution**:
1. Log in as P2L Admin
2. Go to Question Bank (`/p2ladmin/questions`)
3. Add questions manually OR upload CSV
4. Make sure questions have difficulty levels 1-5
5. Ensure questions are active (`is_active: true`)

---

## Question Bank Management

### Adding Questions via UI

1. Go to `/p2ladmin/questions`
2. Click "Add Question"
3. Fill in:
   - Question text
   - Choices (for multiple choice)
   - Correct answer
   - **Difficulty** (1-5, where 1 is easiest)
   - Subject/Topic (optional)
4. Click "Save"

### Bulk Import via CSV

1. Prepare a CSV file with columns:
   ```
   text,choices,answer,difficulty,subject,topic
   "What is 2+2?","2,3,4,5","4",1,"Math","Addition"
   ```
2. Go to `/p2ladmin/questions`
3. Click "Upload CSV"
4. Select your file
5. Verify questions are imported

### Running Seed Script (For Development)

If you need sample questions for testing:

```bash
cd backend
node seed-questions.js
```

This will populate your database with sample questions at various difficulty levels.

---

## Summary of Changes Made

### Files Modified:
1. `backend/models/User.js` - Added `'school-admin'` to role enum
2. `backend/routes/p2lAdminRoutes.js` - Changed school admin creation to use `'school-admin'`
3. `backend/routes/mongoAuthRoutes.js` - Updated normalizeRole function
4. `backend/routes/schoolAdminRoutes.js` - Enhanced security check
5. `RENDER_EMAIL_SETUP.md` - Enhanced environment variable documentation
6. `QUICK_START.md` - Added core application variables

### What Was NOT Changed:
- **Adaptive quiz functionality** - Already working correctly with question bank
- **Question model** - No changes needed
- **Authentication logic** - Only role string was standardized

---

## Need Help?

1. **Check Render logs** for specific error messages
2. **Verify all environment variables** are set correctly in Render dashboard
3. **Review documentation**:
   - `RENDER_EMAIL_SETUP.md` - Detailed email setup guide
   - `QUICK_START.md` - Quick setup instructions
   - `.env.example` - Example environment variables
4. **Test locally first**:
   - Set up `.env` file with your credentials
   - Run `npm start` in backend
   - Verify everything works before deploying

---

## Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use strong JWT_SECRET** (at least 32 random characters)
3. ✅ **Use App Passwords** for Gmail (not your main password)
4. ✅ **Rotate credentials periodically** (every 3-6 months)
5. ✅ **Monitor email usage** for unusual patterns
6. ✅ **Use dedicated email service** for production (SendGrid, Mailgun, AWS SES)
7. ✅ **Keep NODE_ENV=production** in production environments

---

## Production Checklist

Before going live, make sure:

- [ ] All environment variables are set in Render
- [ ] JWT_SECRET is a strong, random string (not default)
- [ ] Email service is configured and tested
- [ ] FRONTEND_URL points to production frontend
- [ ] MongoDB connection is stable
- [ ] School admin creation is working
- [ ] Adaptive quizzes are working
- [ ] Question bank has sufficient questions
- [ ] Welcome emails are being sent
- [ ] Login links in emails point to production (not localhost)
- [ ] All user roles can authenticate successfully

---

**You're all set! 🎉**

The fixes in this PR resolve the school admin creation issue and confirm that adaptive quizzes are working correctly with the question bank.
