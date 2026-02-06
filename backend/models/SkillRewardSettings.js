const mongoose = require('mongoose');

// Schema for managing XP rewards based on question difficulty
const skillRewardSettingsSchema = new mongoose.Schema({
  challengeLevel: { 
    type: Number, 
    enum: [1, 2, 3, 4, 5], 
    required: true,
    unique: true
  },
  successReward: { 
    type: Number, 
    required: true,
    min: 0,
    default: 1
  },
  failurePenalty: { 
    type: Number, 
    required: true,
    max: 0,
    default: -0.5
  },
  lastModified: { type: Date, default: Date.now }
});

skillRewardSettingsSchema.pre('save', function() {
  this.lastModified = Date.now();
});

module.exports = mongoose.model('SkillRewardSettings', skillRewardSettingsSchema);
