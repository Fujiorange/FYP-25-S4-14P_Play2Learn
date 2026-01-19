// backend/server.js - Play2Learn Backend
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ==================== IMPROVED CORS CONFIGURATION ====================
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins - NO trailing slashes
    const allowedOrigins = [
      'https://play2learn-test.onrender.com', // Fixed: no slash
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// JWT Secret - Make sure this is set in Render environment variables!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: JWT_SECRET environment variable is not set in production!');
  process.exit(1);
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ==================== ADD REQUEST LOGGING (For Debugging) ====================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Import routes
const mongoAuthRoutes = require('./routes/mongoAuthRoutes');
app.use('/api/mongo/auth', mongoAuthRoutes);
app.use('/api/auth', mongoAuthRoutes);

const mongoStudentRoutes = require('./routes/mongoStudentRoutes');
app.use('/api/mongo/student', authenticateToken, mongoStudentRoutes);

// API Routes (Keep your existing routes here)
app.post('/api/mongo/items', authenticateToken, async (req, res) => {
  // ... existing code
});

app.get('/api/mongo/items', authenticateToken, async (req, res) => {
  // ... existing code
});

// Health check - ADD CORS HEADERS EXPLICITLY
app.get('/api/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.json({ 
    success: true, 
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ... rest of your code (frontend serving, etc.)

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth Header:', authHeader);
  console.log('Token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required',
      hint: 'Include Authorization header with Bearer token' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token',
        hint: 'Try logging in again to get a new token' 
      });
    }
    req.user = user;
    next();
  });
}
