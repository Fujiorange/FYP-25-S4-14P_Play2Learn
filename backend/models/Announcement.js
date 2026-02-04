const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  
  content: { 
    type: String, 
    required: true 
  },
  
  priority: {
    type: String,
    enum: ['info', 'urgent', 'event'],
    default: 'info'
  },
  
  audience: {
    type: String,
    enum: ['all', 'student', 'students', 'teacher', 'teachers', 'parent', 'parents'],
    default: 'all'
  },
  
  pinned: { 
    type: Boolean, 
    default: false 
  },
  
  author: { 
    type: String,
    required: true 
  },
  
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School',
    required: true,
    index: true  // Index for efficient filtering by school
  },
  
  expiresAt: { 
    type: Date,
    default: null  // null means no expiration
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true  // Index for sorting
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp on save
announcementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for efficient queries
announcementSchema.index({ schoolId: 1, expiresAt: 1, audience: 1 });
announcementSchema.index({ schoolId: 1, pinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
