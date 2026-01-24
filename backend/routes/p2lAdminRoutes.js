const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-this-in-production';

// Middleware to authenticate P2L Admins
const authenticateP2LAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = mongoose.connection.db;
    const admin = await db.collection('users').findOne({ _id: mongoose.Types.ObjectId(decoded.userId), role: 'p2ladmin' });
    if (!admin) return res.status(403).json({ error: 'Access restricted to P2L Admins' });

    req.user = admin;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// ==================== Register P2L Admin ====================
router.post('/register-admin', authenticateP2LAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const db = mongoose.connection.db;
    const existingAdmin = await db.collection('users').findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = {
      name: name,
      email: email,
      password_hash: passwordHash,
      role: 'p2ladmin',
      is_active: true,
      created_at: new Date(),
    };

    await db.collection('users').insertOne(newAdmin);

    res.status(201).json({ success: true, message: 'P2L Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'An error occurred' });
  }
});

// ==================== Default Health Check Endpoint ====================
router.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'success',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Health check failed' });
  }
});

// Other Admin Functions...
module.exports = router;
