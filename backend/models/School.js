const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  organization_name: { type: String, required: true },
  organization_type: { 
    type: String, 
    enum: ['school', 'tutoring_center', 'university', 'training_center', 'other'],
    default: 'school' 
  },
  plan: { 
    type: String, 
    enum: ['free', 'starter', 'professional', 'enterprise'], 
    required: true,
    default: 'free'
  },
  plan_info: {
    teacher_limit: { type: Number, required: true },
    student_limit: { type: Number, required: true },
    class_limit: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true }
  },
  // Contact information
  contact_person: { type: String, default: '' },
  contact: { type: String, default: '' }, // Email
  phone: { type: String, default: '' },
  country: { type: String, default: '' },
  
  // Registration and verification
  verification_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'verified' // Auto-verified for now
  },
  registration_source: { type: String, default: '' }, // How did you hear about us
  
  // Status and tracking
  is_active: { type: Boolean, default: true },
  current_teachers: { type: Number, default: 0 },
  current_students: { type: Number, default: 0 },
  current_classes: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

schoolSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('School', schoolSchema);
