const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  school_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  plan_type: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    required: true,
    default: 'free'
  },
  max_classes: { type: Number, required: true, default: 1 },
  max_teachers: { type: Number, required: true, default: 1 },
  max_students: { type: Number, required: true, default: 5 },
  price: { type: Number, required: true, default: 0 },
  
  // License period
  start_date: { type: Date, required: true, default: Date.now },
  end_date: { type: Date, default: null }, // null for free/ongoing plans
  
  // Status
  is_active: { type: Boolean, default: true },
  auto_renew: { type: Boolean, default: false },
  
  // Payment tracking (for paid plans)
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'n/a'],
    default: 'n/a'
  },
  payment_reference: { type: String, default: null },
  
  // Audit fields
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  upgraded_from: { type: String, default: null }, // Previous plan
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

licenseSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Index for quick license lookups
licenseSchema.index({ school_id: 1, is_active: 1 });

module.exports = mongoose.model('License', licenseSchema);
