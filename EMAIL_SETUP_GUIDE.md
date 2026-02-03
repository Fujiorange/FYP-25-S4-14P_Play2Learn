# Email Setup Guide for Play2Learn on Render

This guide provides detailed step-by-step instructions for setting up email functionality in Play2Learn, specifically for sending login credentials to users via the "Send Credentials" feature.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Choose an Email Service Provider](#step-1-choose-an-email-service-provider)
4. [Step 2: Configure Gmail SMTP (Recommended for Testing)](#step-2-configure-gmail-smtp-recommended-for-testing)
5. [Step 3: Configure SendGrid (Recommended for Production)](#step-3-configure-sendgrid-recommended-for-production)
6. [Step 4: Set Environment Variables on Render](#step-4-set-environment-variables-on-render)
7. [Step 5: Test the Email Configuration](#step-5-test-the-email-configuration)
8. [Step 6: Using the Send Credentials Feature](#step-6-using-the-send-credentials-feature)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Play2Learn uses **Nodemailer** to send emails. When a School Admin creates a new user account (Teacher, Student, or Parent), a temporary password is generated and stored in the database. The School Admin can then use the "Send Credentials" page to send login credentials to users via email.

### How It Works:
1. School Admin creates a new user → Temporary password is generated and stored
2. School Admin goes to "Account Management" → "Send Credentials"
3. School Admin clicks "Send Email" for a user
4. Email is sent with login credentials
5. User receives email and logs in
6. User is prompted to change password on first login

---

## Prerequisites

Before setting up email, ensure you have:
- Access to your Render dashboard
- A domain email or Gmail account for sending emails
- Your Play2Learn backend deployed on Render

---

## Step 1: Choose an Email Service Provider

You have several options for sending emails:

| Provider | Best For | Free Tier | Setup Complexity |
|----------|----------|-----------|------------------|
| Gmail SMTP | Testing/Small scale | 500 emails/day | Easy |
| SendGrid | Production | 100 emails/day free | Medium |
| Mailgun | Production | 5,000 emails/month (3 months) | Medium |
| Amazon SES | High volume | $0.10 per 1,000 emails | Complex |

**Recommendation:**
- Use **Gmail SMTP** for development/testing
- Use **SendGrid** or **Mailgun** for production

---

## Step 2: Configure Gmail SMTP (Recommended for Testing)

### 2.1 Enable 2-Step Verification
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "2-Step Verification" under "Signing in to Google"
3. Follow the prompts to enable it

### 2.2 Create an App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Select your device (e.g., "Windows Computer")
4. Click "Generate"
5. **Copy the 16-character password** (you won't see it again!)

### 2.3 Gmail SMTP Settings
Use these values for your environment variables:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

---

## Step 3: Configure SendGrid (Recommended for Production)

### 3.1 Create a SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account
3. Verify your email address

### 3.2 Create an API Key
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click "Create API Key"
3. Name it (e.g., "Play2Learn")
4. Select "Full Access" or at least "Mail Send"
5. Click "Create & View"
6. **Copy the API key** (you won't see it again!)

### 3.3 Verify Your Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose either:
   - **Single Sender Verification** (quick, for testing)
   - **Domain Authentication** (recommended for production)
3. Follow the verification steps

### 3.4 SendGrid SMTP Settings
Use these values for your environment variables:
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM="Play2Learn <verified-sender@yourdomain.com>"
```

---

## Step 4: Set Environment Variables on Render

### 4.1 Navigate to Your Backend Service
1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click on your Play2Learn **backend service**

### 4.2 Add Environment Variables
1. Click on **Environment** in the left sidebar
2. Add the following environment variables:

| Key | Example Value |
|-----|---------------|
| `EMAIL_HOST` | `smtp.gmail.com` or `smtp.sendgrid.net` |
| `EMAIL_PORT` | `587` |
| `EMAIL_SECURE` | `false` |
| `EMAIL_USER` | Your email or `apikey` for SendGrid |
| `EMAIL_PASSWORD` | Your app password or API key |
| `EMAIL_FROM` | `"Play2Learn <noreply@yourschool.com>"` |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` |

3. Click **Save Changes**

### 4.3 Redeploy the Service
After saving the environment variables:
1. Go to **Manual Deploy** → **Deploy latest commit**
2. Wait for the deployment to complete

---

## Step 5: Test the Email Configuration

### 5.1 Check Backend Logs
1. In Render dashboard, click on your backend service
2. Go to **Logs**
3. Look for: `✅ Email service ready`
4. If you see `❌ Email service error:`, check your credentials

### 5.2 Test via API (Optional)
You can create a test endpoint or use the built-in test file:

```bash
# SSH into your service or use the Shell tab in Render
node test-email.js
```

### 5.3 Test via the Application
1. Log in as a School Admin
2. Create a test user
3. Go to "Send Credentials" page
4. Click "Send Email" for the test user
5. Check if the email was received

---

## Step 6: Using the Send Credentials Feature

### 6.1 Accessing the Feature
1. Log in as **School Admin**
2. Click **Account Management** section
3. Click **📧 Send Credentials**

### 6.2 Understanding the Page
The Pending Credentials page shows:
- All users who have not received their login credentials
- User's name, email, role, and temporary password
- Date the account was created

### 6.3 Sending Credentials
1. Find the user in the list
2. Click the **📤 Send Email** button
3. Wait for confirmation message
4. The user will be removed from the list once sent

### 6.4 What the User Receives
Users receive an email containing:
- Welcome message
- Their login email
- Their temporary password
- Link to the login page
- Instructions to change password on first login

---

## Troubleshooting

### Email Not Sending

**Problem:** Clicking "Send Email" shows an error.

**Solutions:**
1. Check backend logs for specific error messages
2. Verify environment variables are set correctly
3. Ensure the email service is running (check for "Email service ready" in logs)
4. For Gmail: Make sure App Password is correct and 2FA is enabled
5. For SendGrid: Verify your sender identity

### "Invalid Login" Error

**For Gmail:**
- Enable 2-Step Verification
- Use App Password, not your regular password
- Check if "Less secure apps" is blocking access

**For SendGrid:**
- Make sure `EMAIL_USER` is set to `apikey` (literally)
- Verify the API key has "Mail Send" permission
- Check sender verification status

### Email Goes to Spam

**Solutions:**
1. Use a custom domain instead of Gmail
2. Set up SPF, DKIM, and DMARC records for your domain
3. Use a reputable email service like SendGrid
4. Make sure the "From" address is properly configured

### No Users in Pending Credentials

**This is normal if:**
- All created users have already been sent their credentials
- No new users have been created yet
- Users were created with automatic email sending enabled

**To test:**
1. Create a new test user via "Add User (Single)"
2. The user should appear in "Send Credentials" page
3. If not, check if automatic email sending is working

### Environment Variables Not Loading

**Solutions:**
1. Make sure you clicked "Save Changes" after adding variables
2. Redeploy the service
3. Check for typos in variable names
4. Ensure values don't have extra spaces or quotes

---

## Security Best Practices

1. **Never commit email credentials** to your repository
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** periodically
4. **Use strong passwords** for email accounts
5. **Enable 2FA** on your email service accounts
6. **Monitor email sending** for unusual activity

---

## Support

If you encounter issues not covered in this guide:
1. Check the backend logs in Render
2. Review the email service provider's documentation
3. Contact your email service provider's support

---

## Quick Reference

### Gmail SMTP
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Play2Learn <your-email@gmail.com>"
```

### SendGrid SMTP
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key-here
EMAIL_FROM="Play2Learn <verified@yourdomain.com>"
```

### Required Render Environment Variables
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`
- `FRONTEND_URL`
