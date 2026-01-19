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
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVE FRONTEND ====================
// Frontend is in ../frontend/ relative to backend/
const frontendPath = path.join(__dirname, '..', 'frontend', 'build');
const frontendPublicPath = path.join(__dirname, '..', 'frontend', 'public');

console.log('🔍 Looking for frontend at:', frontendPath);

// Serve static files from frontend/build if it exists
if (fs.existsSync(frontendPath)) {
  console.log('✅ Found frontend build at:', frontendPath);
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return res.sendFile(path.join(frontendPath, 'index.html'));
    }
    next();
  });
} else {
  console.log('❌ Frontend build not found at:', frontendPath);
  
  // Show simple dashboard
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Play2Learn Backend</title><style>body{font-family:Arial;padding:40px;text-align:center;}</style></head>
      <body>
        <h1>✅ Play2Learn Backend Running</h1>
        <p>Frontend not built yet. To build:</p>
        <pre style="background:#f0f0f0;padding:10px;display:inline-block;">
cd frontend && npm run build</pre>
        <p>Or update Render build settings to include frontend build.</p>
        <p><a href="/api/health">API Health Check</a></p>
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
╔═══════════════════════════════╗
║   🚀 Server running on ${PORT}   ║
║   📁 Backend: backend/       ║
║   📁 Frontend: frontend/     ║
╚═══════════════════════════════╝
  `);
});
