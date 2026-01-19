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

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Import routes
const mongoAuthRoutes = require('./routes/mongoAuthRoutes');
app.use('/api/mongo/auth', mongoAuthRoutes);
app.use('/api/auth', mongoAuthRoutes);

const mongoStudentRoutes = require('./routes/mongoStudentRoutes');
app.use('/api/mongo/student', authenticateToken, mongoStudentRoutes);

// API Routes
app.post('/api/mongo/items', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('items');
    const item = {
      title: req.body.title,
      description: req.body.description,
      created_by: req.user.email,
      created_at: new Date()
    };
    const result = await collection.insertOne(item);
    res.status(201).json({ success: true, message: 'Item created', item: { ...item, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/mongo/items', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('items');
    const items = await collection.find({}).toArray();
    res.json({ success: true, count: items.length, items: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==================== SERVE FRONTEND ====================
// Frontend is in ../frontend/build relative to backend/
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');

console.log('🔍 Looking for frontend at:', frontendBuildPath);

// Check if frontend build exists
if (fs.existsSync(frontendBuildPath)) {
  console.log('✅ Serving frontend from:', frontendBuildPath);
  
  // Serve static files from frontend/build
  app.use(express.static(frontendBuildPath));
  
  // For all non-API routes, serve the React app
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return res.sendFile(path.join(frontendBuildPath, 'index.html'));
    }
    next();
  });
} else {
  console.log('⚠️ Frontend build not found. Build it with: cd frontend && npm run build');
  
  // Development: Show helpful message
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Play2Learn Backend</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          code {
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 5px;
            display: block;
            margin: 10px 0;
            font-family: monospace;
          }
          a {
            color: #93c5fd;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Play2Learn Backend Running</h1>
          <p>React frontend not built yet.</p>
          
          <h3>To build the frontend:</h3>
          <code>cd frontend && npm run build</code>
          
          <h3>Or on Render, update build command to:</h3>
          <code>npm run render-build</code>
          
          <p><a href="/api/health">📊 API Health Check</a></p>
          <p><a href="https://github.com/Fujiorange/Play2Learn_Test">📁 GitHub Repository</a></p>
        </div>
      </body>
      </html>
    `);
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════╗
║   🚀 Play2Learn Server Running    ║
║   📍 Port: ${PORT}                    ║
║   🍃 MongoDB: Connected           ║
║   📁 Backend: backend/           ║
║   📁 Frontend: frontend/         ║
╚═══════════════════════════════════╝
  `);
  
  // Log available routes
  console.log('\n🌐 Available routes:');
  console.log('  GET  /              - Frontend or dashboard');
  console.log('  GET  /api/health    - Health check');
  console.log('  POST /api/auth/login - User login');
  console.log('  POST /api/auth/register - User registration');
});
