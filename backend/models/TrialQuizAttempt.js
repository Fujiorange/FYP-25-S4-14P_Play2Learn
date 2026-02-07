const mongoose = require('mongoose');

const trialQuizAttemptSchema = new mongoose.Schema(
  {
    trial_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TrialStudent', required: true },

    type: { type: String, default: 'placement' }, // placement

    total_questions: { type: Number, default: 0 },
    correct_count: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // percentage
    result_band: { type: String, default: '' },
    new_profile: { type: Number, default: 1 },

    questions: [
      {
        question_id: { type: mongoose.Schema.Types.ObjectId, required: false },
        prompt: { type: String, required: true },
        operation: { type: String, default: '' },
        choices: { type: [String], default: [] },
        correctIndex: { type: Number, default: 0 },

        selectedIndex: { type: Number, default: null },
        isCorrect: { type: Boolean, default: false },

        difficulty: { type: Number, default: null },
        topic: { type: String, default: null },
        subject: { type: String, default: null },
      },
    ],

    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// helpful indexes
trialQuizAttemptSchema.index({ trial_user_id: 1, student_id: 1, created_at: -1 });
trialQuizAttemptSchema.index({ trial_user_id: 1, created_at: -1 });

module.exports = mongoose.model('TrialQuizAttempt', trialQuizAttemptSchema);
