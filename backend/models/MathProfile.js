const mongoose = require('mongoose');

const mathProfileSchema = new mongoose.Schema({
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  
  // ✅ UPDATED: Now allows level 0 for students who haven't completed placement quiz
  // Level 0 = Not yet placed (placement quiz not completed)
  // Levels 1-10 = Assigned after placement quiz completion
  current_profile: { 
    type: Number, 
    default: 0,  // ✅ CHANGED: Start at 0 instead of 1
    min: 0,      // ✅ CHANGED: Allow 0 (was 1)
    max: 10 
  },
  
  placement_completed: { 
    type: Boolean, 
    default: false 
  },
  
  total_points: { 
    type: Number, 
    default: 0 
  },
  
  consecutive_fails: { 
    type: Number, 
    default: 0 
  },
  
  quizzes_today: { 
    type: Number, 
    default: 0 
  },
  
  last_reset_date: { 
    type: Date, 
    default: Date.now 
  },
  
  streak: { 
    type: Number, 
    default: 0 
  },
  
  last_quiz_date: { 
    type: Date 
  },
  
  // ✅ UPDATED: Adaptive Quiz Level - determines which levels are unlocked in Quiz Journey
  // Level 0 = Quiz Journey locked (placement quiz not completed)
  // Levels 1-10 = Unlocked levels in Quiz Journey
  // This field is set by the placement quiz and updated as student progresses
  adaptive_quiz_level: {
    type: Number,
    default: 0,  // ✅ CHANGED: Start at 0 instead of 1
    min: 0,      // ✅ CHANGED: Allow 0 (was 1)
    max: 10
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add indexes for performance on frequently queried fields
mathProfileSchema.index({ student_id: 1 }, { unique: true });
mathProfileSchema.index({ total_points: -1 }); // For leaderboard sorting
mathProfileSchema.index({ adaptive_quiz_level: 1 }); // For adaptive quiz filtering
mathProfileSchema.index({ current_profile: 1 }); // For legacy quiz system

// ✅ Pre-save hook: Update timestamp
mathProfileSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// ✅ UPDATED: Sync logic - only sync when both values are > 0
// If either is 0, don't sync (student hasn't completed placement yet)
mathProfileSchema.pre('save', function() {
  // Only sync if both fields are greater than 0 (placement completed)
  if (this.adaptive_quiz_level > 0 && this.current_profile > 0) {
    // Use the higher value (student benefit)
    const maxLevel = Math.max(this.adaptive_quiz_level, this.current_profile);
    this.adaptive_quiz_level = maxLevel;
    this.current_profile = maxLevel;
  }
  // If adaptive_quiz_level is set but current_profile is 0, sync current_profile
  else if (this.adaptive_quiz_level > 0 && this.current_profile === 0) {
    this.current_profile = this.adaptive_quiz_level;
  }
  // If current_profile is set but adaptive_quiz_level is 0, sync adaptive_quiz_level
  else if (this.current_profile > 0 && this.adaptive_quiz_level === 0) {
    this.adaptive_quiz_level = this.current_profile;
  }
  // If both are 0, leave them at 0 (placement not completed)
});

module.exports = mongoose.model('MathProfile', mathProfileSchema);