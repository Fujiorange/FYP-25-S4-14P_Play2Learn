const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const License = require('../models/License');

// License plans configuration
const LICENSE_PLANS = {
  free: {
    teacher_limit: 1,
    student_limit: 5,
    class_limit: 1,
    price: 0,
    name: 'Free'
  },
  starter: {
    teacher_limit: 50,
    student_limit: 500,
    class_limit: 999,
    price: 250,
    name: 'Starter'
  },
  professional: {
    teacher_limit: 100,
    student_limit: 1000,
    class_limit: 999,
    price: 500,
    name: 'Professional'
  },
  enterprise: {
    teacher_limit: 250,
    student_limit: 2500,
    class_limit: 999,
    price: 1000,
    name: 'Enterprise'
  }
};

/**
 * POST /api/school-registration/register
 * Register a new school/institution
 * Automatically assigns Free plan and creates School Admin user
 */
router.post('/register', async (req, res) => {
  try {
    const {
      institution_name,
      contact_person,
      email,
      password,
      phone,
      country,
      institution_type,
      hear_about_us
    } = req.body;

    // Validation
    if (!institution_name || !contact_person || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Institution name, contact person, email, and password are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered. Please use a different email or login.'
      });
    }

    // Check if institution name already exists
    const existingSchool = await School.findOne({ 
      organization_name: new RegExp(`^${institution_name}$`, 'i') 
    });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        error: 'An institution with this name already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get Free plan configuration
    const freePlan = LICENSE_PLANS.free;

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create School
      const newSchool = new School({
        organization_name: institution_name,
        organization_type: institution_type || 'school',
        plan: 'free',
        plan_info: {
          teacher_limit: freePlan.teacher_limit,
          student_limit: freePlan.student_limit,
          class_limit: freePlan.class_limit,
          price: freePlan.price
        },
        contact_person: contact_person,
        contact: email,
        phone: phone || '',
        country: country || '',
        registration_source: hear_about_us || '',
        verification_status: 'verified', // Auto-verified for now
        is_active: true,
        current_teachers: 0,
        current_students: 0,
        current_classes: 1 // Will create default class
      });

      await newSchool.save({ session });

      // 2. Create License
      const newLicense = new License({
        school_id: newSchool._id,
        plan_type: 'free',
        max_classes: freePlan.class_limit,
        max_teachers: freePlan.teacher_limit,
        max_students: freePlan.student_limit,
        price: freePlan.price,
        start_date: new Date(),
        end_date: null, // Free plan has no end date
        is_active: true,
        auto_renew: false,
        payment_status: 'n/a'
      });

      await newLicense.save({ session });

      // 3. Create School Admin User
      const newUser = new User({
        name: contact_person,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'School Admin',
        schoolId: newSchool._id.toString(),
        contact: phone || null,
        emailVerified: true, // Auto-verified for now
        requirePasswordChange: false
      });

      await newUser.save({ session });

      // 4. Create Default Class
      const defaultClass = new Class({
        class_name: 'Default Class',
        grade: 'Primary 1',
        subjects: ['Mathematics'],
        teachers: [],
        students: [],
        school_id: newSchool._id,
        is_active: true
      });

      await defaultClass.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      // TODO: Send verification email (if email verification is required)
      // TODO: Send welcome email

      return res.status(201).json({
        success: true,
        message: 'School registered successfully! You can now log in.',
        school: {
          id: newSchool._id,
          name: newSchool.organization_name,
          plan: newSchool.plan
        },
        user: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('School registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
});

/**
 * GET /api/school-registration/verify/:token
 * Verify school email (if email verification is implemented)
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Update user and school verification status
    user.emailVerified = true;
    user.verificationToken = null;
    await user.save();

    const school = await School.findById(user.schoolId);
    if (school) {
      school.verification_status = 'verified';
      await school.save();
    }

    return res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed. Please try again.'
    });
  }
});

module.exports = router;
