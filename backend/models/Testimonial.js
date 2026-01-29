const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student_name: { type: String, required: true },
  student_email: { type: String },
  title: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  message: { type: String, required: true },
  approved: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
