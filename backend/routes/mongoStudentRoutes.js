// backend/routes/mongoStudentRoutes.js - COMPLETE WITH LEVEL-FIRST LEADERBOARD
// ✅ All endpoints match frontend expectations
// ✅ Field names corrected for compatibility
// ✅ Placement quizzes excluded from all statistics
// ✅ Quiz model points to quiz_attempts collection (CRITICAL FIX!)
// ✅ CRITICAL FIX: Placement quiz now sets adaptive_quiz_level for Quiz Journey!
// ✅ STREAK FIX: Automatic midnight reset - simplified logic
// ✅ NEW: Level 0 shown for users who haven't completed placement quiz
// ✅ LEADERBOARD: Level-First Ranking (Level > Points > First Quiz Date)

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ✅ Import shared streak utilities (NOW WITH persistStreakReset)
const { 
  getSingaporeTime, 
  getSgtMidnightTime, 
  updateStreakOnCompletion, 
  computeEffectiveStreak,
  persistStreakReset, // NEW: Auto-reset helper
  MS_PER_DAY 
} = require('../utils/streakUtils');

// ✅ Import topic profile service
const { 
  getUserTopicProfiles,
  getTopicLeaderboard, 
  getCombinedLeaderboard 
} = require('../services/topicProfileService');

// ==================== AUTH ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Invalid token" });
  }
}

router.use(authenticateToken);

// ==================== MODELS ====================
const User = require('../models/User');
const MathProfile = require('../models/MathProfile');
const StudentQuiz = require('../models/StudentQuiz');
const MathSkill = require('../models/MathSkill');
const SupportTicket = require('../models/SupportTicket');
const Testimonial = require('../models/Testimonial');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const SkillPointsConfig = require('../models/SkillPointsConfig');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const { analyzeSentiment } = require('../utils/sentimentKeywords');

// ==================== LEVEL THRESHOLDS ====================
// Level thresholds for points-based leveling system
// Each entry defines the min points required to reach that level
const LEVEL_THRESHOLDS = [
  { level: 0, min: 0, max: 25 },      // Level 0: 0-24 points
  { level: 1, min: 25, max: 50 },     // Level 1: 25-49 points
  { level: 2, min: 50, max: 100 },    // Level 2: 50-99 points
  { level: 3, min: 100, max: 200 },   // Level 3: 100-199 points
  { level: 4, min: 200, max: 400 },   // Level 4: 200-399 points
  { level: 5, min: 400, max: Infinity } // Level 5: 400+ points (max level)
];

// Helper function to calculate level from points
function calculateLevelFromPoints(points) {
  // Find the highest level threshold that the points meet
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].min) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 0;
}

// Helper function to calculate progress percentage within current level
function calculateLevelProgress(points) {
  const level = calculateLevelFromPoints(points);
  const threshold = LEVEL_THRESHOLDS[level];
  
  // If at max level, return 100%
  if (level === 5) return 100;
  
  // Calculate percentage progress within current level range
  const rangeSize = threshold.max - threshold.min;
  const progressInRange = points - threshold.min;
  return Math.min(100, Math.floor((progressInRange / rangeSize) * 100));
}

// ✅ NEW: Helper function to get display level (0 if placement not completed)
function getDisplayLevel(mathProfile) {
  if (!mathProfile) return 0;
  
  // If placement quiz not completed, show Level 0
  if (!mathProfile.placement_completed) {
    return 0;
  }
  
  // Otherwise, show the assigned level
  return mathProfile.adaptive_quiz_level || mathProfile.current_profile || 1;
}

// ==================== PROFILE CONFIG ====================
function getProfileConfig(profile) {
  const configs = {
    1: { range: [1, 10] },
    2: { range: [1, 20] },
    3: { range: [1, 30] },
    4: { range: [1, 40] },
    5: { range: [1, 50] },
    6: { range: [1, 60] },
    7: { range: [1, 70] },
    8: { range: [1, 80] },
    9: { range: [1, 90] },
    10: { range: [1, 100] },
  };
  return configs[profile] || configs[1];
}

if (!mongoose.models.Quiz) {
  mongoose.model("Quiz", new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quiz_type: { type: String, enum: ["placement", "regular"], required: true },
    profile_level: { type: Number, required: true },
    questions: [
      {
        question_text: String,
        operation: String,
        correct_answer: Number,
        student_answer: Number,
        is_correct: Boolean,
      },
    ],
    answers: [Number],
    score: { type: Number, default: 0 },
    total_questions: { type: Number, default: 15 },
    percentage: { type: Number, default: 0 },
    points_earned: { type: Number, default: 0 },
    completed_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
  }, {
    collection: 'quiz_attempts'
  }));
}

if (!mongoose.models.MathSkill) {
  const mathSkillSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill_name: { type: String, required: true },
    current_level: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    unlocked: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  });
  mathSkillSchema.index({ student_id: 1, skill_name: 1 }, { unique: true });
  mongoose.model("MathSkill", mathSkillSchema);
}

if (!mongoose.models.SupportTicket) {
  const supportTicketSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student_name: { type: String, required: true },
    student_email: { type: String, required: true },
    subject: { type: String, required: true },
    category: { type: String, default: 'general' },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
    admin_response: { type: String },
    school_id: { type: String },
  });
  mongoose.model("SupportTicket", supportTicketSchema);
}

if (!mongoose.models.Testimonial) {
  const testimonialSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    student_name: { type: String, required: true },
    student_email: { type: String },
    title: { type: String },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true },
    approved: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  });
  mongoose.model("Testimonial", testimonialSchema);
}

// ==================== SCHEMA COMPATIBILITY HELPER ====================
/**
 * Check if a quiz is completed - handles BOTH old and new schemas
 * OLD: quiz.answers array (used before Jan 30, 2026)
 * NEW: quiz.questions array with student_answer (used after Jan 30, 2026)
 */
function isQuizCompleted(quiz) {
  // NEW format: quiz.questions with nested student_answer
  if (quiz.questions && quiz.questions.length > 0) {
    return quiz.questions.some(q => 
      q.student_answer !== null && q.student_answer !== undefined
    );
  }
  
  // OLD format: quiz.answers array (your Jan 17 quizzes)
  if (quiz.answers && quiz.answers.length > 0) {
    return true;
  }
  
  return false;
}

// ==================== HELPER FUNCTIONS ====================
// getProfileConfig is kept for placement quiz if needed

// Helper function to get default difficulty points configuration
function getDefaultDifficultyPoints() {
  return {
    1: { correct: 1, wrong: -2.5 },
    2: { correct: 2, wrong: -2.0 },
    3: { correct: 3, wrong: -1.5 },
    4: { correct: 4, wrong: -1.0 },
    5: { correct: 5, wrong: -0.5 }
  };
}

// Updated function to use difficulty-based points system
async function updateSkillsFromQuiz(studentId, questions, percentage, currentProfile, quizType = 'regular') {
  try {
    // Get skill points configuration
    let pointsConfig;
    try {
      pointsConfig = await SkillPointsConfig.getConfig();
    } catch (err) {
      console.log("Using default points configuration");
      pointsConfig = { difficultyPoints: getDefaultDifficultyPoints() };
    }
    
    const difficultyPoints = pointsConfig.difficultyPoints || getDefaultDifficultyPoints();
    
    // Calculate points change for each skill/topic
    const skillUpdates = {};

    questions.forEach((q) => {
      // Get skill name from operation (for placement/regular quiz) or topic (for adaptive quiz)
      let skill;
      if (q.topic && q.topic.trim() !== '') {
        // Capitalize first letter of topic
        skill = q.topic.charAt(0).toUpperCase() + q.topic.slice(1);
      } else if (q.operation) {
        skill = q.operation.charAt(0).toUpperCase() + q.operation.slice(1);
      } else {
        skill = "Addition"; // Default
      }
      
      // Get difficulty level (default to 3 if not specified)
      const difficulty = q.difficulty || 3;
      const difficultyStr = String(difficulty);
      
      // Get points for this difficulty level
      const levelPoints = difficultyPoints[difficultyStr] || difficultyPoints['3'];
      
      if (!skillUpdates[skill]) {
        skillUpdates[skill] = { 
          correct: 0, 
          total: 0, 
          pointsChange: 0 
        };
      }
      
      skillUpdates[skill].total++;
      
      if (q.is_correct || q.isCorrect) {
        skillUpdates[skill].correct++;
        skillUpdates[skill].pointsChange += levelPoints.correct;
      } else {
        skillUpdates[skill].pointsChange += levelPoints.wrong;
      }
    });

    const skillNames = Object.keys(skillUpdates);
    
    // Fetch all existing skills in a single query instead of N queries
    const existingSkills = await MathSkill.find({ 
      student_id: studentId, 
      skill_name: { $in: skillNames } 
    });
    
    const skillMap = new Map(existingSkills.map(s => [s.skill_name, s]));
    const bulkOps = [];

    for (const [skillName, stats] of Object.entries(skillUpdates)) {
      const skillPercentage = (stats.correct / stats.total) * 100;
      // XP is still calculated and stored for backward compatibility and display purposes
      // but is no longer used for level calculation (points are used instead)
      const xpGain = Math.floor(skillPercentage / 10);

      const existingSkill = skillMap.get(skillName);
      
      if (existingSkill) {
        // Update existing skill using bulk operation
        const newXp = existingSkill.xp + xpGain;
        
        // Calculate new points (minimum 0 - cannot go negative)
        const currentPoints = existingSkill.points || 0;
        const newPoints = Math.max(0, currentPoints + stats.pointsChange);
        
        // Calculate level based on points using helper function
        const newLevel = calculateLevelFromPoints(newPoints);
        
        bulkOps.push({
          updateOne: {
            filter: { _id: existingSkill._id },
            update: { 
              $set: { 
                xp: newXp, 
                current_level: newLevel,
                points: newPoints,
                updatedAt: new Date() 
              } 
            }
          }
        });
      } else {
        // Insert new skill using bulk operation
        const newXp = xpGain;
        
        // New skill starts with calculated points (minimum 0)
        const newPoints = Math.max(0, stats.pointsChange);
        
        // Calculate level based on points using helper function
        const newLevel = calculateLevelFromPoints(newPoints);
        
        bulkOps.push({
          insertOne: {
            document: {
              student_id: studentId,
              skill_name: skillName,
              current_level: newLevel,
              xp: newXp,
              points: newPoints,
              unlocked: true,
              updatedAt: new Date()
            }
          }
        });
      }
    }

    // Execute all updates in a single bulk operation
    if (bulkOps.length > 0) {
      await MathSkill.bulkWrite(bulkOps);
    }
  } catch (error) {
    console.error("Error updating skills:", error);
  }
}

// ==================== DASHBOARD ENDPOINT ====================
router.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.user.userId;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    // ✅ NEW: Create profile with level 0 if doesn't exist
    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 0, // ✅ START AT LEVEL 0
        adaptive_quiz_level: 0, // ✅ START AT LEVEL 0
        placement_completed: false,
        total_points: 0,
        consecutive_fails: 0,
        quizzes_today: 0,
        last_reset_date: new Date(),
        streak: 0,
      });
    }

    // ✅ NEW: Check and persist automatic midnight streak reset
    const { effective: effectiveStreak, shouldPersistReset } = computeEffectiveStreak(mathProfile);
    
    if (shouldPersistReset) {
      await persistStreakReset(mathProfile);
    }

    // ✅ FIX: Get all regular quizzes, then filter out unsubmitted ones
    const allRegularQuizzes = await StudentQuiz.find({ 
      student_id: studentId,
      quiz_type: "regular" 
    });

    // Filter: Only count quizzes that have been submitted (have student answers)
    const completedRegularQuizzes = allRegularQuizzes.filter(isQuizCompleted).length;
    
    // Also get adaptive quiz attempts
    const completedAdaptiveQuizzes = await QuizAttempt.countDocuments({
      userId: studentId,
      is_completed: true
    });
    
    // Total completed quizzes (regular + adaptive)
    const completedQuizzes = completedRegularQuizzes + completedAdaptiveQuizzes;

    const user = await User.findById(studentId);

    // ✅ NEW: Get earned badges count to show as achievements
    const db = mongoose.connection.db;
    const earnedBadges = await db.collection('student_badges')
      .find({ student_email: user?.email })
      .toArray();
    const achievementsCount = earnedBadges.length || 0;

    // ✅ NEW: Get display level (0 if placement not completed)
    const displayLevel = getDisplayLevel(mathProfile);

    res.json({
      success: true,
      dashboard: {
        totalPoints: mathProfile.total_points || 0,
        completedQuizzes: completedQuizzes || 0,
        currentProfile: displayLevel, // ✅ SHOW LEVEL 0 IF NO PLACEMENT
        gradeLevel: user?.gradeLevel || 'Primary 1',
        streak: effectiveStreak || 0, // Use effective streak (0 if broken)
        placementCompleted: mathProfile.placement_completed || false,
        achievements: achievementsCount,
      },
      data: {
        points: mathProfile.total_points || 0,
        quizzesTaken: completedQuizzes || 0,
        level: displayLevel, // ✅ SHOW LEVEL 0 IF NO PLACEMENT
        gradeLevel: user?.gradeLevel || 'Primary 1',
        streak: effectiveStreak || 0, // Use effective streak (0 if broken)
        achievements: achievementsCount,
      }
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard" });
  }
});

// ==================== MATH PROFILE ENDPOINT (FIXED!) ====================
router.get("/math-profile", async (req, res) => {
  try {
    const studentId = req.user.userId;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    // ✅ NEW: Create profile with level 0 if doesn't exist
    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 0, // ✅ START AT LEVEL 0
        adaptive_quiz_level: 0, // ✅ START AT LEVEL 0
        placement_completed: false,
        total_points: 0,
        consecutive_fails: 0,
        quizzes_today: 0,
        last_reset_date: new Date(),
        streak: 0,
      });
    }

    // ✅ NEW: Check and persist automatic midnight streak reset
    const { effective: effectiveStreak, shouldPersistReset } = computeEffectiveStreak(mathProfile);
    
    if (shouldPersistReset) {
      await persistStreakReset(mathProfile);
    }

    // Reset daily quizzes if needed
    const now = getSingaporeTime();
    const lastResetMid = getSgtMidnightTime(mathProfile.last_reset_date || now);
    const todayMid = getSgtMidnightTime(now);

    if (todayMid > lastResetMid) {
      mathProfile.quizzes_today = 0;
      mathProfile.last_reset_date = now;
      await mathProfile.save();
    }

    const dailyLimit = 2; // Frontend expects 2 quizzes per day

    // ✅ NEW: Get display level (0 if placement not completed)
    const displayLevel = getDisplayLevel(mathProfile);

    // ✅ FIXED: Return "mathProfile" to match frontend expectations
    res.json({
      success: true,
      mathProfile: {
        current_profile: displayLevel, // ✅ SHOW LEVEL 0 IF NO PLACEMENT
        placement_completed: mathProfile.placement_completed,
        total_points: mathProfile.total_points,
        consecutive_fails: mathProfile.consecutive_fails,
        streak: effectiveStreak, // Use effective streak (0 if broken)
        quizzes_today: mathProfile.quizzes_today,
        quizzes_remaining: Math.max(0, dailyLimit - mathProfile.quizzes_today),
        attemptsToday: mathProfile.quizzes_today,
      }
    });
  } catch (error) {
    console.error("❌ Math profile error:", error);
    res.status(500).json({ success: false, error: "Failed to load math profile" });
  }
});

// ==================== MATH SKILLS ENDPOINT ====================
router.get("/math-skills", async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Use lean() for read-only queries to improve performance
    const mathProfile = await MathProfile.findOne({ student_id: studentId }).lean();
    
    // Get all skills for this student (dynamic - includes any topics from quizzes)
    const skills = await MathSkill.find({ student_id: studentId });

    // Ensure base skills exist (Addition, Subtraction, Multiplication, Division)
    const baseSkills = ['Addition', 'Subtraction', 'Multiplication', 'Division'];
    const existingSkillNames = skills.map(s => s.skill_name);

    // Batch create missing base skills
    const missingSkills = baseSkills.filter(name => !existingSkillNames.includes(name));
    
    if (missingSkills.length > 0) {
      const newSkillDocs = missingSkills.map(skillName => ({
        student_id: studentId,
        skill_name: skillName,
        current_level: 0,
        xp: 0,
        points: 0,
        unlocked: true,
      }));
      const createdSkills = await MathSkill.insertMany(newSkillDocs);
      skills.push(...createdSkills);
    }

    // ✅ NEW: Get display level (0 if placement not completed)
    const displayLevel = getDisplayLevel(mathProfile);

    res.json({
      success: true,
      currentProfile: displayLevel, // ✅ SHOW LEVEL 0 IF NO PLACEMENT
      skills: skills.map(s => ({
        skill_name: s.skill_name,
        current_level: s.current_level,
        xp: s.xp,
        points: s.points || 0,
        max_level: 5,
        unlocked: s.unlocked,
        percentage: calculateLevelProgress(s.points || 0),
      }))
    });
  } catch (error) {
    console.error("❌ Math skills error:", error);
    res.status(500).json({ success: false, error: "Failed to load math skills" });
  }
});

// ==================== PLACEMENT QUIZ - STATUS ====================
// ==================== PLACEMENT QUIZ - STATUS ====================
// ✅ NEW: Check placement status (supports topic-specific check)
router.get("/placement-quiz/status", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { topic } = req.query;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    if (!mathProfile) {
      // If no profile exists, placement is not completed
      return res.json({
        success: true,
        placementCompleted: false,
        placement_completed: false,
        byTopic: {}
      });
    }

    // If topic is specified, check that specific topic
    if (topic) {
      const topicPlacement = mathProfile.placement_by_topic?.get(topic.trim());
      return res.json({
        success: true,
        placementCompleted: topicPlacement ? topicPlacement.completed : false,
        placement_completed: topicPlacement ? topicPlacement.completed : false,
        topic: topic.trim(),
        level: topicPlacement ? topicPlacement.level : null,
        completed_at: topicPlacement ? topicPlacement.completed_at : null
      });
    }

    // Return overall placement status + breakdown by topic
    const byTopic = {};
    if (mathProfile.placement_by_topic && mathProfile.placement_by_topic.size > 0) {
      for (const [topic, data] of mathProfile.placement_by_topic.entries()) {
        byTopic[topic] = {
          completed: data.completed,
          level: data.level,
          completed_at: data.completed_at
        };
      }
    }

    res.json({
      success: true,
      placementCompleted: mathProfile.placement_completed || false,
      placement_completed: mathProfile.placement_completed || false,
      current_profile: getDisplayLevel(mathProfile), // ✅ SHOW LEVEL 0 IF NO PLACEMENT
      byTopic: byTopic
    });
  } catch (error) {
    console.error("❌ Get placement status error:", error);
    res.status(500).json({ success: false, error: "Failed to get placement status" });
  }
});

// ==================== PLACEMENT QUIZ - GET AVAILABLE TOPICS ====================
// ✅ NEW: Get topics available for placement quiz (based on launched Level 1 quizzes)
router.get("/placement-quiz/topics", async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    // Get student info for class checking
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student profile not found' 
      });
    }

    // Get all unique topics from Quiz Level 1 questions
    const Question = mongoose.model('Question');
    const topics = await Question.distinct('topic', { 
      is_active: true, 
      quiz_level: 1,
      topic: { $ne: '', $ne: null }  // Exclude empty topics
    });

    // Get launched quizzes for this student's class (Level 1 only, case-insensitive)
    const launchedQuizzes = await Quiz.find({
      quiz_level: 1,
      is_launched: true,
      is_active: true,
      $or: [
        { launched_for_classes: student.class ? student.class.toLowerCase() : null },
        { launched_for_school: student.schoolId?.toString() }
      ]
    }).select('topic');

    const launchedTopics = launchedQuizzes
      .map(q => q.topic)
      .filter(t => t && t.trim() !== '');

    // Get placement status for topics
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const completedTopics = [];
    
    if (mathProfile && mathProfile.placement_by_topic) {
      for (const [topic, data] of mathProfile.placement_by_topic.entries()) {
        if (data.completed) {
          completedTopics.push(topic);
        }
      }
    }

    console.log(`📚 Available topics for placement: ${topics.length} total, ${launchedTopics.length} launched`);

    res.json({
      success: true,
      allTopics: topics.sort(),
      launchedTopics: [...new Set(launchedTopics)].sort(), // Remove duplicates
      completedTopics: completedTopics.sort(),
      availableTopics: launchedTopics.filter(t => !completedTopics.includes(t)).sort()
    });
  } catch (error) {
    console.error("❌ Get placement topics error:", error);
    res.status(500).json({ success: false, error: "Failed to get placement topics" });
  }
});

// ==================== PLACEMENT QUIZ - FIND QUIZ ====================
// Returns the launched Quiz Level 1 (adaptive) for the given topic, for this student's class.
// Used by the placement quiz frontend to get the quiz ID, then start an adaptive attempt.

// Simple per-user rate limit middleware: max 20 find-quiz calls per minute per user
const _findQuizRateMap = new Map();
function findQuizRateLimit(req, res, next) {
  const userId = req.user.userId;
  const now = Date.now();
  const windowMs = 60_000;
  const maxCalls = 20;
  const record = _findQuizRateMap.get(userId) || { count: 0, windowStart: now };
  if (now - record.windowStart > windowMs) { record.count = 0; record.windowStart = now; }
  record.count += 1;
  _findQuizRateMap.set(userId, record);
  if (record.count > maxCalls) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please wait a moment.' });
  }
  next();
}

router.get("/placement-quiz/find-quiz", findQuizRateLimit, async (req, res) => {
  try {
    const { topic } = req.query;
    const studentId = req.user.userId;

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const normalizedTopic = topic.trim();

    // Find the launched adaptive quiz at level 1 for this topic and student's class
    const orConditions = [];
    if (student.class) {
      orConditions.push({ launched_for_classes: student.class.toLowerCase() });
    }
    if (student.schoolId) {
      orConditions.push({ launched_for_school: student.schoolId.toString() });
    }
    // Globally launched (no class or school restriction)
    orConditions.push({
      $and: [
        { $or: [{ launched_for_classes: { $size: 0 } }, { launched_for_classes: { $exists: false } }] },
        { $or: [{ launched_for_school: null }, { launched_for_school: { $exists: false } }] }
      ]
    });

    const quiz = await Quiz.findOne({
      quiz_level: 1,
      quiz_type: 'adaptive',
      topic: normalizedTopic,
      is_launched: true,
      is_active: true,
      $or: orConditions
    }).sort({ createdAt: -1 });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: `No placement quiz available for topic "${normalizedTopic}". Please ask your teacher to launch one.`
      });
    }

    res.json({
      success: true,
      quizId: quiz._id,
      topic: normalizedTopic,
      quizTitle: quiz.title
    });
  } catch (error) {
    console.error('❌ Find placement quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to find placement quiz' });
  }
});

// ==================== PLACEMENT QUIZ - GENERATE ====================
// ✅ NEW: Topic-based placement quiz - only uses Quiz Level 1 questions
router.post("/placement-quiz/generate", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { topic } = req.body;

    // ✅ Validate topic is provided
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Topic is required. Please select a topic for the placement quiz.",
      });
    }

    const normalizedTopic = topic.trim();

    let mathProfile = await MathProfile.findOne({ student_id: studentId });

    if (!mathProfile) {
      mathProfile = await MathProfile.create({
        student_id: studentId,
        current_profile: 0, // ✅ START AT LEVEL 0
        adaptive_quiz_level: 0, // ✅ START AT LEVEL 0
        placement_completed: false,
        placement_by_topic: {},
        total_points: 0,
      });
    }

    // ✅ Check if placement already completed for this topic
    const topicPlacement = mathProfile.placement_by_topic?.get(normalizedTopic);
    if (topicPlacement && topicPlacement.completed) {
      return res.status(400).json({
        success: false,
        error: `Placement quiz for "${normalizedTopic}" already completed`,
      });
    }

    // ✅ CRITICAL FIX: Pull ONLY Quiz Level 1 questions for the specified topic
    const Question = mongoose.model('Question');
    const randomQuestions = await Question.aggregate([
      { 
        $match: { 
          is_active: true,
          quiz_level: 1,  // ✅ ONLY Level 1 questions
          topic: normalizedTopic  // ✅ ONLY questions for selected topic
        } 
      },
      { $sample: { size: 20 } }
    ]);

    if (!randomQuestions || randomQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No Quiz Level 1 questions found for topic "${normalizedTopic}". Please contact your administrator.`,
      });
    }

    // ✅ Warn if fewer than 20 questions available
    if (randomQuestions.length < 20) {
      console.warn(`⚠️ Only ${randomQuestions.length} Quiz Level 1 questions available for topic "${normalizedTopic}"`);
    }

    // Create a student quiz attempt record using filtered questions
    const quiz = await StudentQuiz.create({
      student_id: studentId,
      quiz_type: "placement",
      profile_level: 1, // Placement is always for level 1
      topic: normalizedTopic, // ✅ Store topic
      questions: randomQuestions.map(q => ({
        question_text: q.text || q.question_text,
        operation: 'general',
        correct_answer: q.answer || q.correct_answer,
        student_answer: null,
        is_correct: false,
      })),
      score: 0,
      total_questions: randomQuestions.length,
    });

    console.log(`✅ Generated placement quiz for topic "${normalizedTopic}" with ${randomQuestions.length} Quiz Level 1 questions`);

    res.json({
      success: true,
      quiz_id: quiz._id,
      topic: normalizedTopic,
      questions: randomQuestions.map((q) => ({ 
        question_text: q.text || q.question_text, 
        choices: q.choices,
        operation: 'general' 
      })),
      total_questions: randomQuestions.length,
    });
  } catch (error) {
    console.error("❌ Generate placement quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to generate placement quiz" });
  }
});

// ==================== PLACEMENT QUIZ - SUBMIT ====================
// ✅ PLACEMENT QUIZ DOES NOT UPDATE STREAK - Only sets initial level
router.post("/placement-quiz/submit", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { quiz_id, answers } = req.body;

    const quiz = await StudentQuiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "placement") {
      return res.status(404).json({ success: false, error: "Placement quiz not found" });
    }

    const totalQuestions = quiz.questions.length;
    
    // Validate answers array length
    if (!Array.isArray(answers) || answers.length !== totalQuestions) {
      return res.status(400).json({ 
        success: false, 
        error: `Expected ${totalQuestions} answers, but received ${answers?.length || 0}` 
      });
    }

    let score = 0;
    
    quiz.questions.forEach((q, i) => {
      const studentAnswer = answers[i];
      q.student_answer = studentAnswer;
      
      // Handle undefined/null answers explicitly
      if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
        q.is_correct = false;
      } else {
        // Compare answers as strings (case-insensitive and trimmed)
        const correctAnswer = String(q.correct_answer).trim().toLowerCase();
        const givenAnswer = String(studentAnswer).trim().toLowerCase();
        q.is_correct = givenAnswer === correctAnswer;
      }
      
      if (q.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / totalQuestions) * 100);
    quiz.points_earned = score * 10;
    quiz.completed_at = new Date();
    await quiz.save();

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const quizTopic = quiz.topic || 'General';

    let startingProfile = 1;
    // Map percentage score to profile level (1-10)
    if (quiz.percentage >= 90) startingProfile = 10;      // 90-100% → Level 10
    else if (quiz.percentage >= 80) startingProfile = 9;  // 80-89% → Level 9
    else if (quiz.percentage >= 70) startingProfile = 8;  // 70-79% → Level 8
    else if (quiz.percentage >= 60) startingProfile = 7;  // 60-69% → Level 7
    else if (quiz.percentage >= 50) startingProfile = 6;  // 50-59% → Level 6
    else if (quiz.percentage >= 40) startingProfile = 5;  // 40-49% → Level 5
    else if (quiz.percentage >= 30) startingProfile = 4;  // 30-39% → Level 4
    else if (quiz.percentage >= 20) startingProfile = 3;  // 20-29% → Level 3
    else if (quiz.percentage >= 10) startingProfile = 2;  // 10-19% → Level 2
    else startingProfile = 1;                             // 0-9% → Level 1

    // ✅ CAP placement to maximum Level 3 (starting level 1 + 2)
    startingProfile = Math.min(startingProfile, 3);

    // ✅ Track placement completion by topic
    if (!mathProfile.placement_by_topic) {
      mathProfile.placement_by_topic = new Map();
    }
    
    mathProfile.placement_by_topic.set(quizTopic, {
      completed: true,
      level: startingProfile,
      completed_at: new Date()
    });

    // ✅ Set BOTH fields for Quiz Journey unlocking (use highest level from all topics)
    const allTopicLevels = Array.from(mathProfile.placement_by_topic.values()).map(t => t.level);
    const highestLevel = Math.max(startingProfile, ...allTopicLevels);
    
    mathProfile.current_profile = highestLevel;
    mathProfile.adaptive_quiz_level = highestLevel;
    
    // Mark global placement_completed as true after first topic
    mathProfile.placement_completed = true;
    mathProfile.total_points += quiz.points_earned;
    
    // ⚠️ CRITICAL: DO NOT UPDATE STREAK FOR PLACEMENT QUIZ
    // Streak only updates when students complete Quiz Journey (adaptive quizzes)
    console.log(`📝 Placement quiz does NOT update streak - only Quiz Journey counts`);
    
    await mathProfile.save();

    console.log(`✅ Placement quiz completed for student ${studentId}:`);
    console.log(`   - Topic: ${quizTopic}`);
    console.log(`   - Score: ${score}/${totalQuestions} (${quiz.percentage}%)`);
    console.log(`   - Assigned Level for ${quizTopic}: ${startingProfile}`);
    console.log(`   - Highest Level across topics: ${highestLevel}`);
    console.log(`   - current_profile: ${mathProfile.current_profile}`);
    console.log(`   - adaptive_quiz_level: ${mathProfile.adaptive_quiz_level}`);
    console.log(`   - Streak NOT updated (placement quiz doesn't count)`);

    await updateSkillsFromQuiz(studentId, quiz.questions, quiz.percentage, startingProfile);

    res.json({
      success: true,
      result: {
        score,
        total: totalQuestions,
        percentage: quiz.percentage,
        points_earned: quiz.points_earned,
        starting_profile: startingProfile,
        assigned_profile: startingProfile,
        placement_completed: true,
      },
    });
  } catch (error) {
    console.error("❌ Submit placement quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to submit placement quiz" });
  }
});

// ==================== MATH PROGRESS ====================
router.get("/math-progress", async (req, res) => {
  try {
    const studentId = req.user.userId;

    let mathProfile = await MathProfile.findOne({ student_id: studentId });

    // ✅ NEW: Check and persist automatic midnight streak reset
    if (mathProfile) {
      const { effective: effectiveStreak, shouldPersistReset } = computeEffectiveStreak(mathProfile);
      
      if (shouldPersistReset) {
        await persistStreakReset(mathProfile);
      }

      // Get all quizzes (regular)
      const allRegularQuizzes = await StudentQuiz.find({ student_id: studentId, quiz_type: "regular" })
        .sort({ completed_at: -1 })
        .lean();
      
      const regularQuizzes = allRegularQuizzes.filter(isQuizCompleted);

      // Get all adaptive quizzes
      const adaptiveAttempts = await QuizAttempt.find({ 
        userId: studentId, 
        is_completed: true 
      }).sort({ completedAt: -1 }).lean();

      const totalQuizzes = regularQuizzes.length + adaptiveAttempts.length;
      const averageScore =
        totalQuizzes > 0
          ? Math.round(
              (regularQuizzes.reduce((sum, q) => sum + q.percentage, 0) +
                adaptiveAttempts.reduce((sum, a) => sum + ((a.correct_count / a.total_answered) * 100 || 0), 0)) /
                totalQuizzes
            )
          : 0;

      const totalPoints = mathProfile.total_points || 0;

      // ✅ NEW: Get display level (0 if placement not completed)
      const displayLevel = getDisplayLevel(mathProfile);

      res.json({
        success: true,
        progressData: {
          currentProfile: displayLevel, // ✅ SHOW LEVEL 0 IF NO PLACEMENT
          totalQuizzes,
          averageScore,
          totalPoints,
          streak: effectiveStreak, // Use effective streak (0 if broken)
          recentQuizzes: regularQuizzes.slice(0, 10).map((q) => ({
            date: q.completed_at.toLocaleDateString(),
            time: q.completed_at.toLocaleTimeString(),
            profile: q.profile_level,
            score: q.score,
            total: q.total_questions,
            percentage: q.percentage,
          })),
        },
      });
    } else {
      res.json({
        success: true,
        progressData: {
          currentProfile: 0, // ✅ SHOW LEVEL 0 IF NO PROFILE
          totalQuizzes: 0,
          averageScore: 0,
          totalPoints: 0,
          streak: 0,
          recentQuizzes: [],
        },
      });
    }
  } catch (error) {
    console.error("❌ Math progress error:", error);
    res.status(500).json({ success: false, error: "Failed to load progress data" });
  }
});

// ==================== QUIZ RESULTS / HISTORY ====================
router.get("/quiz-results", async (req, res) => {
  try {
    const studentId = req.user.userId;
    // Use lean() for read-only query to improve performance
    const allQuizzes = await StudentQuiz.find({ student_id: studentId, quiz_type: "regular" })
      .sort({ completed_at: -1 })
      .lean();

    // Filter out unsubmitted quizzes using the shared isQuizCompleted function
    const completedQuizzes = allQuizzes.filter(isQuizCompleted);

    res.json({
      success: true,
      results: completedQuizzes.map((q) => ({
        id: q._id,
        profile: q.profile_level,
        date: q.completed_at.toLocaleDateString(),
        time: q.completed_at.toLocaleTimeString(),
        score: q.score,
        total: q.total_questions,
        percentage: q.percentage,
        points_earned: q.points_earned,
      })),
    });
  } catch (error) {
    console.error("❌ Quiz results error:", error);
    res.status(500).json({ success: false, error: "Failed to load quiz results" });
  }
});

router.get("/quiz-history", async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    // Get regular quizzes from StudentQuiz collection
    const regularQuizzes = await StudentQuiz.find({ student_id: studentId, quiz_type: "regular" })
      .sort({ completed_at: -1 })
      .lean();

    // Filter out unsubmitted quizzes using the shared isQuizCompleted function
    const completedRegularQuizzes = regularQuizzes.filter(isQuizCompleted);

    // Get adaptive quizzes from QuizAttempt collection
    const adaptiveAttempts = await QuizAttempt.find({ 
      userId: studentId, 
      is_completed: true 
    })
      .populate('quizId', 'title')
      .sort({ completedAt: -1 })
      .lean();

    // Format regular quizzes
    const regularHistory = completedRegularQuizzes.map((q) => ({
      id: q._id,
      quizType: 'regular',
      quizTitle: 'Math Practice Quiz',
      profile: q.profile_level,
      profile_level: q.profile_level,
      date: q.completed_at ? q.completed_at.toLocaleDateString() : 'N/A',
      time: q.completed_at ? q.completed_at.toLocaleTimeString() : 'N/A',
      score: q.score,
      maxScore: q.total_questions,
      totalQuestions: q.total_questions,
      percentage: q.percentage,
      points_earned: q.points_earned,
      completedAt: q.completed_at
    }));

    // Format adaptive quizzes
    const adaptiveHistory = adaptiveAttempts.map((a) => ({
      id: a._id,
      quizType: 'adaptive',
      quizTitle: a.quizId?.title || 'Adaptive Quiz',
      profile: a.current_difficulty || 1,
      profile_level: a.current_difficulty || 1,
      date: a.completedAt ? new Date(a.completedAt).toLocaleDateString() : 'N/A',
      time: a.completedAt ? new Date(a.completedAt).toLocaleTimeString() : 'N/A',
      score: a.correct_count || 0,
      maxScore: a.total_answered || 0,
      totalQuestions: a.total_answered || 0,
      percentage: a.total_answered > 0 ? Math.round((a.correct_count / a.total_answered) * 100) : 0,
      // Calculate approximate points: 10 points per correct answer (adaptive quizzes don't store points_earned)
      points_earned: (a.correct_count || 0) * 10,
      completedAt: a.completedAt
    }));

    // Combine and sort by completion date
    const allHistory = [...regularHistory, ...adaptiveHistory].sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
      const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      history: allHistory.map(({ completedAt, ...rest }) => rest), // Remove completedAt from response
    });
  } catch (error) {
    console.error("❌ Quiz history error:", error);
    res.status(500).json({ success: false, error: "Failed to load quiz history" });
  }
});

// ==================== LEADERBOARD (LEVEL-FIRST RANKING!) ====================
// ✅ Ranks by: 1) Level (highest first), 2) Points, 3) First quiz date
router.get("/leaderboard", async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { schoolId, class: classId } = req.query;

    console.log(`📊 Leaderboard request for user: ${currentUserId}`);
    console.log(`   schoolId: ${schoolId}, classId: ${classId}`);

    // Get current user's school and class
    const currentUser = await User.findById(currentUserId).lean();
    
    if (!currentUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Use provided parameters or fall back to current user's school/class
    const filterSchoolId = schoolId || currentUser.schoolId;
    // Handle class parameter - convert string 'null' to actual null
    const filterClass = (classId === undefined || classId === null || classId === 'null') 
      ? null 
      : classId;

    // Build filter query
    const filterQuery = {
      role: 'Student' // Only show students
    };
    
    // Always filter by school
    if (filterSchoolId) {
      filterQuery.schoolId = filterSchoolId;
    }
    
    // Only add class filter if classId is provided and not null
    if (filterClass) {
      filterQuery.class = filterClass;
    }

    console.log(`🎯 Leaderboard filter:`, filterQuery);

    // Find students matching school (and optionally class)
    const matchingStudents = await User.find(filterQuery)
      .select('_id name email schoolId class')
      .lean();

    console.log(`✅ Found ${matchingStudents.length} matching students`);

    if (matchingStudents.length === 0) {
      return res.json({
        success: true,
        leaderboard: [],
        filterInfo: {
          schoolId: filterSchoolId,
          class: filterClass,
          totalMatches: 0
        }
      });
    }

    const studentIds = matchingStudents.map(s => s._id);

    // ✅ Ensure current user is in the list
    if (!studentIds.some(id => id.toString() === currentUserId)) {
      console.log(`⚠️ Current user not in filtered list - adding manually`);
      matchingStudents.push(currentUser);
      studentIds.push(currentUser._id);
    }

    // Get math profiles for these students
    const profiles = await MathProfile.find({ student_id: { $in: studentIds } })
      .lean();

    console.log(`📊 Found ${profiles.length} math profiles`);

    // ✅ Create default profile for students without one
    const profileMap = new Map(profiles.map(p => [p.student_id.toString(), p]));
    const allProfiles = studentIds.map(studentId => {
      const existingProfile = profileMap.get(studentId.toString());
      if (existingProfile) {
        return existingProfile;
      } else {
        console.log(`⚠️ Creating default profile for student: ${studentId}`);
        return {
          student_id: studentId,
          total_points: 0,
          placement_completed: false,
          current_profile: 0,
          adaptive_quiz_level: 0
        };
      }
    });

    // Get earliest quiz completion date for each student (for tie-breaking)
    const db = mongoose.connection.db;
    const studentMap = new Map(matchingStudents.map(s => [s._id.toString(), s]));
    
    // Enrich profiles with student data and first quiz date
    const enrichedProfiles = await Promise.all(allProfiles.map(async (p) => {
      const student = studentMap.get(p.student_id.toString());
      
      // Get earliest quiz completion for this student
      const earliestQuiz = await StudentQuiz.findOne({
        student_id: p.student_id,
        quiz_type: 'regular',
        completed_at: { $exists: true }
      }).sort({ completed_at: 1 }).select('completed_at').lean();
      
      // Also check adaptive quizzes
      const earliestAdaptive = await QuizAttempt.findOne({
        userId: p.student_id,
        is_completed: true,
        completedAt: { $exists: true }
      }).sort({ completedAt: 1 }).select('completedAt').lean();
      
      // Use the earliest between regular and adaptive
      let firstCompletionDate = null;
      if (earliestQuiz && earliestAdaptive) {
        firstCompletionDate = earliestQuiz.completed_at < earliestAdaptive.completedAt 
          ? earliestQuiz.completed_at 
          : earliestAdaptive.completedAt;
      } else if (earliestQuiz) {
        firstCompletionDate = earliestQuiz.completed_at;
      } else if (earliestAdaptive) {
        firstCompletionDate = earliestAdaptive.completedAt;
      }
      
      // Get earned badges count
      const earnedBadges = await db.collection('student_badges')
        .countDocuments({ student_email: student?.email });
      
      // ✅ Get display level (0 if placement not completed)
      const displayLevel = getDisplayLevel(p);
      
      const isCurrentUser = p.student_id.toString() === currentUserId;
      
      if (isCurrentUser) {
        console.log(`✅ Current user found in leaderboard:`, {
          name: student?.name,
          points: p.total_points || 0,
          level: displayLevel,
          placementCompleted: p.placement_completed
        });
      }
      
      return {
        student_id: p.student_id,
        name: student ? student.name : "Unknown",
        points: p.total_points || 0,
        level: displayLevel,
        achievements: earnedBadges || 0,
        firstCompletionDate: firstCompletionDate,
        isCurrentUser: isCurrentUser
      };
    }));

    // ✅✅✅ LEVEL-FIRST RANKING SYSTEM ✅✅✅
    // Sort by: 1) Level (desc), 2) Points (desc), 3) First completion date (asc)
    enrichedProfiles.sort((a, b) => {
      // 🥇 PRIMARY: Level (higher level = higher rank)
      if (a.level !== b.level) {
        return b.level - a.level;
      }
      
      // 🥈 SECONDARY: Points (more points = higher rank if same level)
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      
      // 🥉 TIE-BREAKER: First completion date (earlier = higher rank)
      if (a.firstCompletionDate && b.firstCompletionDate) {
        return a.firstCompletionDate - b.firstCompletionDate;
      } else if (a.firstCompletionDate) {
        return -1; // a has date, b doesn't - a ranks higher
      } else if (b.firstCompletionDate) {
        return 1; // b has date, a doesn't - b ranks higher
      }
      
      return 0; // Equal in all aspects
    });

    // Assign ranks
    enrichedProfiles.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    // Limit to top 50
    const leaderboard = enrichedProfiles.slice(0, 50).map(entry => ({
      rank: entry.rank,
      name: entry.name,
      points: entry.points,
      level: entry.level,
      profile: entry.level,
      achievements: entry.achievements,
      isCurrentUser: entry.isCurrentUser
    }));

    console.log(`✅ Leaderboard generated with ${leaderboard.length} entries (Level-First Ranking)`);
    
    const currentUserEntry = leaderboard.find(e => e.isCurrentUser);
    if (currentUserEntry) {
      console.log(`✅ Current user rank: #${currentUserEntry.rank} (Level ${currentUserEntry.level})`);
    } else {
      console.log(`⚠️ Current user NOT in top 50`);
    }

    res.json({
      success: true,
      leaderboard,
      filterInfo: {
        schoolId: filterSchoolId,
        class: filterClass,
        totalMatches: matchingStudents.length
      }
    });
  } catch (error) {
    console.error("❌ Leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
});

// ✅ NEW: Get student's own topic profiles
router.get("/my-topic-profiles", async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const profiles = await getUserTopicProfiles(userId);
    
    res.json({
      success: true,
      profiles
    });
  } catch (error) {
    console.error("❌ Get topic profiles error:", error);
    res.status(500).json({ success: false, error: "Failed to load topic profiles" });
  }
});

// ✅ NEW: Get topic-based leaderboard for students
router.get("/leaderboard/by-topic", async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { topic, classId } = req.query;

    if (!topic) {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic parameter is required' 
      });
    }

    // Get current user to determine school
    const currentUser = await User.findById(currentUserId).lean();
    
    if (!currentUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Build filter for students in same school/class
    const filterQuery = {
      role: 'Student',
      schoolId: currentUser.schoolId
    };
    
    if (classId && classId !== 'all') {
      filterQuery.class = classId;
    } else if (currentUser.class) {
      filterQuery.class = currentUser.class; // Default to current user's class
    }

    const students = await User.find(filterQuery).select('_id');
    const studentIds = students.map(s => s._id);

    if (studentIds.length === 0) {
      return res.json({ success: true, topic, leaderboard: [] });
    }

    // Get topic leaderboard
    const leaderboard = await getTopicLeaderboard(topic, studentIds);

    res.json({ 
      success: true, 
      topic, 
      leaderboard,
      currentUserId 
    });
  } catch (error) {
    console.error("❌ Topic leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load topic leaderboard" });
  }
});

// ✅ NEW: Get combined leaderboard across all topics for students
router.get("/leaderboard/combined", async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { classId } = req.query;

    // Get current user to determine school
    const currentUser = await User.findById(currentUserId).lean();
    
    if (!currentUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Build filter for students in same school/class
    const filterQuery = {
      role: 'Student',
      schoolId: currentUser.schoolId
    };
    
    if (classId && classId !== 'all') {
      filterQuery.class = classId;
    } else if (currentUser.class) {
      filterQuery.class = currentUser.class; // Default to current user's class
    }

    const students = await User.find(filterQuery).select('_id');
    const studentIds = students.map(s => s._id);

    if (studentIds.length === 0) {
      return res.json({ success: true, leaderboard: [] });
    }

    // Get combined leaderboard
    const leaderboard = await getCombinedLeaderboard(studentIds);

    res.json({ 
      success: true, 
      leaderboard,
      currentUserId 
    });
  } catch (error) {
    console.error("❌ Combined leaderboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load combined leaderboard" });
  }
});

// ✅ NEW: Get available topics for student leaderboard
router.get("/leaderboard/topics", async (req, res) => {
  try {
    const TopicProfile = require('../models/TopicProfile');
    const currentUserId = req.user.userId;

    // Get current user to determine school
    const currentUser = await User.findById(currentUserId).lean();
    
    if (!currentUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Get all students in same school
    const students = await User.find({
      role: 'Student',
      schoolId: currentUser.schoolId
    }).select('_id');
    
    const studentIds = students.map(s => s._id);

    if (studentIds.length === 0) {
      return res.json({ success: true, topics: [] });
    }

    // Get distinct topics
    const topics = await TopicProfile.distinct('topic', {
      userId: { $in: studentIds }
    });

    // Filter and sort
    const filteredTopics = topics.filter(t => t && t.trim() !== '').sort();

    res.json({ success: true, topics: filteredTopics });
  } catch (error) {
    console.error("❌ Get topics error:", error);
    res.status(500).json({ success: false, error: "Failed to load topics" });
  }
});

// ==================== SKILL MATRIX ====================
// Get student's own skill matrix (by topic)
router.get("/my-skills", async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const MathSkill = require('../models/MathSkill');
    const skills = await MathSkill.find({ student_id: userId })
      .sort({ skill_name: 1 })
      .lean();
    
    // Group skills by topic for easier display
    const skillsByTopic = {};
    skills.forEach(skill => {
      const topic = skill.skill_name || 'General';
      if (!skillsByTopic[topic]) {
        skillsByTopic[topic] = {
          topic: topic,
          level: skill.current_level || 0,
          xp: skill.xp || 0,
          points: skill.points || 0,
          unlocked: skill.unlocked !== false
        };
      }
    });
    
    res.json({
      success: true,
      skills,
      skillsByTopic
    });
  } catch (error) {
    console.error("❌ Get student skills error:", error);
    res.status(500).json({ success: false, error: "Failed to load skills" });
  }
});

// ==================== SUPPORT TICKETS ====================
router.post("/support-tickets", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, category, message, description, student_name, student_email } = req.body;

    const finalSubject = subject || 'Support Request';
    const finalMessage = message || description || '';

    if (!finalMessage) {
      return res.status(400).json({ 
        success: false, 
        error: "Message is required" 
      });
    }

    // Get user info for details
    const user = await User.findById(userId).lean();
    
    // Detect user role for the ticket
    let userRole = 'Student';
    if (user?.role) {
      if (user.role === 'Teacher' || user.role === 'Trial Teacher') {
        userRole = 'Teacher';
      } else if (user.role === 'Parent') {
        userRole = 'Parent';
      } else {
        userRole = 'Student';
      }
    }
    
    const ticket = await SupportTicket.create({
      // New unified fields
      user_id: userId,
      user_name: student_name || req.user.name || user?.name || 'Unknown',
      user_email: student_email || req.user.email || user?.email || 'unknown@email.com',
      user_role: userRole,
      school_id: user?.school,
      school_name: user?.schoolName || '',
      subject: finalSubject,
      category: category || 'general',
      message: finalMessage,
      status: 'open',
      priority: req.body.priority || 'normal',
      // Legacy fields for backward compatibility
      student_id: userId,
      student_name: student_name || req.user.name || user?.name || 'Unknown',
      student_email: student_email || req.user.email || user?.email || 'unknown@email.com',
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticketId: ticket._id,
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        created_at: ticket.created_at,
      }
    });
  } catch (error) {
    console.error("❌ Create support ticket error:", error);
    res.status(500).json({ success: false, error: "Failed to create support ticket" });
  }
});

router.get("/support-tickets", async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Use lean() for read-only query to improve performance
    const tickets = await SupportTicket.find({ 
      $or: [{ student_id: studentId }, { user_id: studentId }] 
    })
      .sort({ created_at: -1 })
      .lean();

    res.json({
      success: true,
      tickets: tickets.map(t => ({
        id: t._id,
        subject: t.subject,
        category: t.category,
        message: t.message,
        status: t.status,
        priority: t.priority,
        createdOn: t.created_at.toLocaleDateString(),
        lastUpdate: t.updated_at.toLocaleDateString(),
        created_at: t.created_at,
        updated_at: t.updated_at,
        admin_response: t.admin_response,
        responded_at: t.responded_at,
        hasReply: !!t.admin_response,
      }))
    });
  } catch (error) {
    console.error("❌ Get support tickets error:", error);
    res.status(500).json({ success: false, error: "Failed to load support tickets" });
  }
});

// Get single support ticket with details
router.get("/support-tickets/:ticketId", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      $or: [{ student_id: studentId }, { user_id: studentId }]
    }).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
        status: ticket.status,
        priority: ticket.priority,
        createdOn: ticket.created_at.toLocaleDateString(),
        lastUpdate: ticket.updated_at.toLocaleDateString(),
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        admin_response: ticket.admin_response,
        responded_at: ticket.responded_at,
        hasReply: !!ticket.admin_response,
      }
    });
  } catch (error) {
    console.error("❌ Get support ticket error:", error);
    res.status(500).json({ success: false, error: "Failed to load support ticket" });
  }
});

// ==================== TESTIMONIALS ====================
router.post("/testimonials", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { rating, message, testimonial, title, student_name, student_email, displayName } = req.body;

    const finalMessage = message || testimonial || '';
    
    // Validation
    if (!rating || !finalMessage) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating and message are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating must be between 1 and 5" 
      });
    }

    // Message length validation
    if (finalMessage.trim().length < 20) {
      return res.status(400).json({ 
        success: false, 
        error: "Message must be at least 20 characters long" 
      });
    }

    if (finalMessage.length > 2000) {
      return res.status(400).json({ 
        success: false, 
        error: "Message must not exceed 2000 characters" 
      });
    }

    // Perform enhanced sentiment analysis using shared utility
    const sentimentAnalysis = analyzeSentiment(finalMessage, rating, sentiment);

    const testimonialDoc = await Testimonial.create({
      student_id: studentId,
      student_name: displayName || student_name || req.user.name || 'Anonymous',
      student_email: student_email || req.user.email,
      title: title || '',
      rating,
      message: finalMessage,
      approved: false,
      user_role: 'Student',
      sentiment_score: sentimentAnalysis.score,
      sentiment_label: sentimentAnalysis.label,
    });

    res.status(201).json({
      success: true,
      message: "Testimonial submitted successfully (pending approval)",
      testimonial: {
        id: testimonialDoc._id,
        rating: testimonialDoc.rating,
        message: testimonialDoc.message,
        created_at: testimonialDoc.created_at,
      }
    });
  } catch (error) {
    console.error("❌ Create testimonial error:", error);
    res.status(500).json({ success: false, error: "Failed to submit testimonial" });
  }
});

router.get("/testimonials", async (req, res) => {
  try {
    // Use lean() for read-only query to improve performance
    const testimonials = await Testimonial.find({ approved: true })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      testimonials: testimonials.map(t => ({
        id: t._id,
        student_name: t.student_name,
        title: t.title,
        rating: t.rating,
        message: t.message,
        created_at: t.created_at,
      }))
    });
  } catch (error) {
    console.error("❌ Get testimonials error:", error);
    res.status(500).json({ success: false, error: "Failed to load testimonials" });
  }
});

// ==================== REWARD SHOP ENDPOINTS ====================

// Get available shop items
router.get("/shop", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = req.user.userId;

    // Get user's school
    const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
    const schoolId = user?.school;

    // Get shop items for this school
    const shopItems = await db.collection('shop_items')
      .find({ 
        isActive: true,
        $or: [
          { school_id: schoolId },
          { school_id: { $exists: false } } // Include legacy items without school_id
        ]
      })
      .sort({ category: 1, cost: 1 })
      .toArray();

    res.json({
      success: true,
      items: shopItems
    });
  } catch (error) {
    console.error("❌ Get shop items error:", error);
    res.status(500).json({ success: false, error: "Failed to load shop items" });
  }
});

// Purchase a shop item
router.post("/shop/:itemId/purchase", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { itemId } = req.params;
    const studentId = req.user.userId;
    const userEmail = req.user.email;

    // Get math profile (this is where points are stored!)
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      return res.status(404).json({ success: false, error: "Student profile not found" });
    }

    // Get shop item
    const item = await db.collection('shop_items').findOne({ 
      _id: new mongoose.Types.ObjectId(itemId) 
    });
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    if (!item.isActive) {
      return res.status(400).json({ success: false, error: "Item is no longer available" });
    }

    // Check if already purchased
    const existingPurchase = await db.collection('student_purchases').findOne({
      student_email: userEmail,
      item_id: itemId
    });
    if (existingPurchase) {
      return res.status(400).json({ success: false, error: "You already own this item" });
    }

    // Check if student has enough points
    const currentPoints = mathProfile.total_points || 0;
    if (currentPoints < item.cost) {
      return res.status(400).json({ 
        success: false, 
        error: `Not enough points. You need ${item.cost - currentPoints} more points.` 
      });
    }

    // Check stock
    if (item.stock === 0) {
      return res.status(400).json({ success: false, error: "Item is out of stock" });
    }

    // Deduct points from math profile
    mathProfile.total_points -= item.cost;
    mathProfile.updatedAt = new Date();
    await mathProfile.save();

    // Record purchase
    const purchase = {
      student_id: studentId,
      student_email: userEmail,
      item_id: itemId,
      item_name: item.name,
      item_icon: item.icon,
      cost: item.cost,
      category: item.category,
      purchased_at: new Date(),
      is_active: true
    };
    await db.collection('student_purchases').insertOne(purchase);

    // Update shop item stock and purchase count
    const updates = { 
      purchaseCount: (item.purchaseCount || 0) + 1 
    };
    if (item.stock !== -1) {
      updates.stock = item.stock - 1;
    }
    await db.collection('shop_items').updateOne(
      { _id: new mongoose.Types.ObjectId(itemId) },
      { $set: updates }
    );

    const remainingPoints = currentPoints - item.cost;
    console.log(`✅ Purchase successful: ${userEmail} bought ${item.name} for ${item.cost} points. Remaining: ${remainingPoints}`);

    res.json({
      success: true,
      message: `Successfully purchased ${item.name}!`,
      pointsRemaining: remainingPoints,
      purchase
    });
  } catch (error) {
    console.error("❌ Purchase error:", error);
    res.status(500).json({ success: false, error: "Failed to complete purchase" });
  }
});

// Get student's purchases
router.get("/shop/purchases", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userEmail = req.user.email;

    const purchases = await db.collection('student_purchases')
      .find({ student_email: userEmail })
      .sort({ purchased_at: -1 })
      .toArray();

    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error("❌ Get purchases error:", error);
    res.status(500).json({ success: false, error: "Failed to load purchases" });
  }
});

// ==================== BADGE ENDPOINTS ====================

// Get all badges with earned status
router.get("/badges", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userEmail = req.user.email;
    const userId = req.user.userId;

    // Get user's school
    const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
    const schoolId = user?.school;

    // Get all active badges for this school
    const badges = await db.collection('badges')
      .find({ 
        isActive: true,
        $or: [
          { school_id: schoolId },
          { school_id: { $exists: false } } // Include legacy badges without school_id
        ]
      })
      .sort({ rarity: 1, criteriaValue: 1 })
      .toArray();

    // Get student's earned badges
    const earnedBadges = await db.collection('student_badges')
      .find({ student_email: userEmail })
      .toArray();

    res.json({
      success: true,
      badges,
      earnedBadges
    });
  } catch (error) {
    console.error("❌ Get badges error:", error);
    res.status(500).json({ success: false, error: "Failed to load badges" });
  }
});

// Get badge progress for current student
router.get("/badges/progress", async (req, res) => {
  try {
    const studentId = req.user.userId;
    const userEmail = req.user.email;

    // Get math profile data
    const mathProfile = await MathProfile.findOne({ student_id: studentId });

    console.log(`📊 Math Profile for ${userEmail}:`, mathProfile);

    // Get user's school for filtering badges
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    const schoolId = user?.school;

    // ✅ FIX: Use Quiz model with SAME logic as Dashboard/Progress
    const allQuizzes = await StudentQuiz.find({ 
      student_id: studentId,
      quiz_type: "regular" 
    });

    // Filter: Only count quizzes that have been submitted (have student answers)
    const completedRegularQuizzes = allQuizzes.filter(isQuizCompleted);
    
    // Also count adaptive quiz attempts
    const completedAdaptiveQuizzes = await QuizAttempt.countDocuments({
      userId: studentId,
      is_completed: true
    });
    
    // Total completed quizzes (regular + adaptive)
    const completedQuizzes = [...completedRegularQuizzes];
    const totalCompletedCount = completedRegularQuizzes.length + completedAdaptiveQuizzes;

    console.log(`📝 Found ${completedRegularQuizzes.length} regular quizzes + ${completedAdaptiveQuizzes} adaptive quizzes for ${userEmail}`);
    
    // Log quiz scores for debugging
    if (completedRegularQuizzes.length > 0) {
      console.log(`Quiz scores:`, completedRegularQuizzes.map(q => ({
        score: q.score,
        percentage: q.percentage,
        date: q.completed_at
      })));
    }

    // Count perfect scores from regular quizzes (score === totalQuestions)
    let perfectScoresCount = 0;
    for (const quiz of completedRegularQuizzes) {
      if (quiz.score === quiz.totalQuestions) {
        perfectScoresCount++;
      }
    }
    
    // Count high scores from regular quizzes (percentage >= 90)
    const highScoresRegular = completedRegularQuizzes.filter(q => q.percentage >= 90).length;
    
    // Count perfect and high scores from adaptive quizzes
    let perfectScoresAdaptive = 0;
    let highScoresAdaptive = 0;
    if (completedAdaptiveQuizzes > 0) {
      const adaptiveQuizzes = await QuizAttempt.find({
        userId: studentId,
        is_completed: true
      });
      
      for (const quiz of adaptiveQuizzes) {
        const percentage = (quiz.correct_count / quiz.total_answered) * 100;
        if (quiz.correct_count === quiz.total_answered) {
          perfectScoresAdaptive++;
        }
        if (percentage >= 90) {
          highScoresAdaptive++;
        }
      }
    }

    // Calculate progress for different criteria
    const progress = {
      quizzes_completed: totalCompletedCount,
      login_streak: mathProfile?.streak || 0,
      perfect_scores: perfectScoresCount + perfectScoresAdaptive,
      high_scores: highScoresRegular + highScoresAdaptive,
      points_earned: mathProfile?.total_points || 0
    };

    console.log(`📊 Badge progress for ${userEmail}:`, progress);

    // Check and auto-award badges - filter by school
    const badges = await db.collection('badges').find({ 
      isActive: true,
      $or: [
        { school_id: schoolId },
        { school_id: { $exists: false } }
      ]
    }).toArray();
    const earnedBadges = await db.collection('student_badges')
      .find({ student_email: userEmail })
      .toArray();
    const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id.toString()));

    for (const badge of badges) {
      // Skip if already earned
      if (earnedBadgeIds.has(badge._id.toString())) continue;

      // Check if criteria met
      const currentValue = progress[badge.criteriaType] || 0;
      if (currentValue >= badge.criteriaValue) {
        // Award badge
        const newBadge = {
          student_id: studentId,
          student_email: userEmail,
          badge_id: badge._id,
          badge_name: badge.name,
          badge_icon: badge.icon,
          rarity: badge.rarity,
          earned_at: new Date(),
          criteria_met: {
            type: badge.criteriaType,
            value: currentValue,
            required: badge.criteriaValue
          }
        };
        await db.collection('student_badges').insertOne(newBadge);

        // Update badge earned count
        await db.collection('badges').updateOne(
          { _id: badge._id },
          { $inc: { earnedCount: 1 } }
        );

        console.log(`🏆 Badge awarded: ${badge.name} to ${userEmail}`);
        earnedBadgeIds.add(badge._id.toString());
      }
    }

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error("❌ Get badge progress error:", error);
    res.status(500).json({ success: false, error: "Failed to load badge progress" });
  }
});

module.exports = router;