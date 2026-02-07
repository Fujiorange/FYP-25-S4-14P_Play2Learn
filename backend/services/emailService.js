// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

// Send student credentials to parent's email
async function sendStudentCredentialsToParent(student, tempPassword, parentEmail, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: parentEmail,
    subject: `${student.name}'s Play2Learn Account Created 🎮`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .login-card { background: white; border: 2px dashed #F59E0B; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Student Account Ready! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear Parent,</p>
            
            <p>Your child <strong>${student.name}</strong> can now access Play2Learn at <strong>${schoolName}</strong>!</p>
            
            <div class="login-card">
              <h3>🎮 Student Login Card</h3>
              <p><strong>Name:</strong> ${student.name}</p>
              <p><strong>Class:</strong> ${student.class || 'N/A'}</p>
              <hr style="margin: 15px 0;">
              <p><strong>Email:</strong> ${student.email}</p>
              <p><strong>Password:</strong> ${tempPassword}</p>
            </div>
            
            <p><strong>⚠️ Please help your child:</strong></p>
            <ol>
              <li>Login using the credentials above</li>
              <li>Keep these credentials safe</li>
              <li>Contact the teacher if they face any issues</li>
            </ol>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Go to Login Page</a>
            </center>
          </div>
          <div class="footer">
            <p>Questions? Contact ${schoolName} School Admin<br>
            This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Student credentials sent to parent: ${parentEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${parentEmail}:`, error);
    return { success: false, error: error.message };
  }
}

// Send welcome email to teacher
async function sendTeacherWelcomeEmail(teacher, tempPassword, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: teacher.email,
    subject: 'Welcome to Play2Learn! 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Play2Learn!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${teacher.name}</strong>,</p>
            
            <p>Your Play2Learn teacher account for <strong>${schoolName}</strong> has been created successfully!</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>📧 Email:</strong> ${teacher.email}</p>
              <p><strong>🔑 Password:</strong> ${tempPassword}</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login Now</a>
            </center>
          </div>
          <div class="footer">
            <p>This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${teacher.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${teacher.email}:`, error);
    return { success: false, error: error.message };
  }
}

// Send welcome email to parent
async function sendParentWelcomeEmail(parent, tempPassword, studentName, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: parent.email,
    subject: `Track ${studentName}'s Learning Progress 📊`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #10B981; margin: 20px 0; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Play2Learn!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${parent.name}</strong>,</p>
            
            <p>Your Play2Learn parent account has been created! You can now monitor <strong>${studentName}'s</strong> learning journey at <strong>${schoolName}</strong>.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>📧 Email:</strong> ${parent.email}</p>
              <p><strong>🔑 Password:</strong> ${tempPassword}</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">View Progress Now</a>
            </center>
          </div>
          <div class="footer">
            <p>This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${parent.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${parent.email}:`, error);
    return { success: false, error: error.message };
  }
}

// Send welcome email to school admin
async function sendSchoolAdminWelcomeEmail(admin, tempPassword, schoolName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: admin.email,
    subject: 'School Admin Account Created - Play2Learn 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7C3AED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #7C3AED; margin: 20px 0; }
          .button { display: inline-block; background: #7C3AED; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>School Admin Account Created!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${admin.name}</strong>,</p>
            
            <p>Your School Admin account for <strong>${schoolName}</strong> has been created successfully!</p>
            
            <p>As a school administrator, you can:</p>
            <ul>
              <li>Create and manage teacher accounts</li>
              <li>Create and manage student accounts</li>
              <li>Monitor school performance and statistics</li>
              <li>Manage classes and assignments</li>
            </ul>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>📧 Email:</strong> ${admin.email}</p>
              <p><strong>🔑 Temporary Password:</strong> ${tempPassword}</p>
              <p style="color: #EF4444; margin-top: 10px;"><strong>⚠️ Important:</strong> Please change your password after first login.</p>
            </div>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Dashboard</a>
            </center>
            
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              Note: You are limited to the number of teachers and students based on your school's license plan.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ School admin welcome email sent to ${admin.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${admin.email}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTeacherWelcomeEmail,
  sendParentWelcomeEmail,
  sendStudentCredentialsToParent,
  sendSchoolAdminWelcomeEmail,
  sendSchoolRegistrationConfirmation,
  sendSchoolWelcomeEmail,
  sendLicenseLimitWarning,
  sendLicenseUpgradeConfirmation
};

// Send school registration confirmation email
async function sendSchoolRegistrationConfirmation(school, adminUser) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: school.contact,
    subject: '🎓 Welcome to Play2Learn - School Registration Confirmed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .plan-info { background: white; padding: 20px; border: 2px solid #10B981; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Play2Learn! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear ${school.contact_person},</p>
            
            <p>Thank you for registering <strong>${school.organization_name}</strong> with Play2Learn!</p>
            
            <div class="plan-info">
              <h3>🎁 Your Free Plan Includes:</h3>
              <ul>
                <li>✅ 1 Teacher account</li>
                <li>✅ 5 Student accounts</li>
                <li>✅ 1 Class</li>
                <li>✅ Full access to adaptive quiz system</li>
                <li>✅ Student progress tracking</li>
              </ul>
            </div>
            
            <p><strong>Your account is ready!</strong> You can now log in and start:</p>
            <ol>
              <li>Creating your teacher account</li>
              <li>Adding up to 5 students</li>
              <li>Setting up your class</li>
              <li>Accessing the adaptive quiz features</li>
            </ol>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Dashboard</a>
            </center>
            
            <p style="margin-top: 20px; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
              <strong>💡 Need more capacity?</strong><br>
              Upgrade to our paid plans for more teachers, students, and classes.<br>
              Visit your dashboard to explore upgrade options.
            </p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at ${process.env.EMAIL_FROM}<br>
            This is an automated message from Play2Learn.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration confirmation sent to ${school.contact}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${school.contact}:`, error);
    return { success: false, error: error.message };
  }
}

// Send welcome email after school verification
async function sendSchoolWelcomeEmail(school, adminUser) {
  // Similar to confirmation, can be customized for post-verification
  return sendSchoolRegistrationConfirmation(school, adminUser);
}

// Send license limit warning email
async function sendLicenseLimitWarning(school, limitType, currentCount, maxCount) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: school.contact,
    subject: `⚠️ License Limit Alert - ${limitType} Limit Approaching`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning { background: #FEF3C7; padding: 20px; border-left: 4px solid #F59E0B; margin: 20px 0; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>License Limit Warning</h1>
          </div>
          <div class="content">
            <p>Dear ${school.contact_person || 'School Admin'},</p>
            
            <div class="warning">
              <h3>⚠️ You're approaching your ${limitType} limit!</h3>
              <p><strong>Current Usage:</strong> ${currentCount} / ${maxCount} ${limitType}</p>
            </div>
            
            <p>To continue adding more ${limitType.toLowerCase()}, please upgrade your license plan.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/school-admin/upgrade" class="button">View Upgrade Options</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ License warning sent to ${school.contact}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send warning email:`, error);
    return { success: false, error: error.message };
  }
}

// Send license upgrade confirmation email
async function sendLicenseUpgradeConfirmation(school, oldPlan, newPlan) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: school.contact,
    subject: '🎉 License Upgraded Successfully - Play2Learn',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .plan-comparison { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>License Upgraded! 🎉</h1>
          </div>
          <div class="content">
            <p>Dear ${school.contact_person || 'School Admin'},</p>
            
            <p>Your license has been successfully upgraded!</p>
            
            <div class="plan-comparison">
              <h3>Your New Plan: ${newPlan.name}</h3>
              <ul>
                <li>Teachers: ${newPlan.teacher_limit}</li>
                <li>Students: ${newPlan.student_limit}</li>
                <li>Classes: ${newPlan.class_limit === 999 ? 'Unlimited' : newPlan.class_limit}</li>
                <li>Price: $${newPlan.price}/month</li>
              </ul>
            </div>
            
            <p>You can now add more users and classes according to your new plan limits.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/school-admin/dashboard" class="button">Go to Dashboard</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Upgrade confirmation sent to ${school.contact}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send upgrade email:`, error);
    return { success: false, error: error.message };
  }
}