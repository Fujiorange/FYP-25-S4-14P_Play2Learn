// backend/routes/mongoAuthRoutes.js - FIXED REGISTRATION
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Helper function to capitalize role properly
function capitalizeRole(role) {
  const roleMap = {
    'student': 'Student',
    'teacher': 'Teacher',
    'parent': 'Parent',
    'school admin': 'School Admin',
    'platform admin': 'Platform Admin',
    'trial student': 'Trial Student',
    'trial teacher': 'Trial Teacher'
  };
  
  const lowerRole = role.toLowerCase();
  return roleMap[lowerRole] || role.charAt(0).toUpperCase() + role.slice(1);
}

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, gender, dateOfBirth, contact } = req.body;

    console.log('📝 Registration attempt:', { email, role: `${role} -> ${capitalizeRole(role)}`, gender, dateOfBirth });

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Capitalize role to match User model enum
    const capitalizedRole = capitalizeRole(role);

    // Prepare user data
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: capitalizedRole,
      accountActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add optional fields if provided
    if (gender) userData.gender = gender;
    if (contact) userData.contact = contact;
    // Convert camelCase to snake_case for date field
    if (dateOfBirth) {
      userData.date_of_birth = new Date(dateOfBirth);
    }

    const newUser = await User.create(userData);

    console.log('✅ User registered:', newUser.email);

    res.json({
      success: true,
      message: 'Registration successful! Please login.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        gender: newUser.gender,
        date_of_birth: newUser.date_of_birth,
        contact: newUser.contact
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
});

// ==================== LOGIN - SIMPLE & WORKING ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('🔐 Login attempt:', { email, role });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password exists
    if (!user.password) {
      console.log('⚠️ User has no password:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // ✅ NO ROLE CHECK - Accept any role
    // This was causing the issue - removed strict role checking

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', user.email, '- Role:', user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        schoolId: user.schoolId,
        class: user.class,
        gradeLevel: user.gradeLevel,
        subject: user.subject,
        emailVerified: user.emailVerified,
        accountActive: user.accountActive
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', (req, res) => {
  try {
    console.log('👋 Logout request');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// ==================== GET CURRENT USER ====================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        schoolId: user.schoolId,
        class: user.class,
        gradeLevel: user.gradeLevel,
        subject: user.subject,
        emailVerified: user.emailVerified,
        accountActive: user.accountActive
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/update-profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, contact, gender, date_of_birth } = req.body;

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (name) user.name = name;
    if (contact !== undefined) user.contact = contact;
    if (gender !== undefined) user.gender = gender;
    if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
    
    user.updatedAt = new Date();
    await user.save();

    console.log('✅ Profile updated:', user.email);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        gender: user.gender,
        date_of_birth: user.date_of_birth
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;