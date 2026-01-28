// backend/routes/mongoStudentRoutes.js - COMPREHENSIVE FIX v11
// Fixed issues:
// 1. Quiz submit error (findOneAndUpdate return value)
// 2. Points desync between mathprofiles and students
// 3. Badges locked out issue
// 4. Shop purchase not working
// 5. Track Progress showing different points

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// ==================== SCHEMAS ====================
const mathProfileSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  current_profile: { type: Number, default: 1 },
  total_points: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  last_activity_date: { type: Date },
  consecutive_fails: { type: Number, default: 0 },
  quizzes_today: { type: Number, default: 0 },
  last_quiz_date: { type: Date },
  placement_completed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

const quizSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quiz_type: { type: String, enum: ["placement", "regular"], required: true },
  profile_level: { type: Number },
  questions: [{
    question_text: String,
    correct_answer: Number,
    student_answer: Number,
    is_correct: Boolean,
    operation: String,
    difficulty: Number,
  }],
  score: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  points_earned: { type: Number, default: 0 },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
});

const MathProfile = mongoose.models.MathProfile || mongoose.model("MathProfile", mathProfileSchema);
const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ success: false, error: "No token" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

router.use(authenticateToken);

// ==================== HELPER FUNCTIONS ====================

// Sync points from mathprofiles to students collection
async function syncPointsToStudent(db, studentId, userEmail, mathProfile) {
  try {
    const result = await db.collection('students').updateOne(
      { $or: [
        { user_id: new mongoose.Types.ObjectId(studentId) },
        { email: userEmail }
      ]},
      { 
        $set: { 
          points: mathProfile.total_points,
          level: mathProfile.current_profile,
          streak: mathProfile.streak || 0,
          updated_at: new Date()
        }
      }
    );
    
    // If no student record exists, create one
    if (result.matchedCount === 0) {
      const user = await db.collection('users').findOne({ 
        $or: [
          { _id: new mongoose.Types.ObjectId(studentId) },
          { email: userEmail }
        ]
      });
      
      if (user) {
        await db.collection('students').insertOne({
          user_id: user._id,
          email: user.email,
          name: user.name,
          class: user.class,
          grade_level: user.gradeLevel || 'Primary 1',
          points: mathProfile.total_points,
          level: mathProfile.current_profile,
          streak: mathProfile.streak || 0,
          total_quizzes: 0,
          badges: [],
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`✅ Created student record for ${user.email}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing points to student:', error);
    return false;
  }
}

// Check and award badges automatically
async function checkAndAwardBadges(db, studentId, userEmail) {
  try {
    // Find student
    let student = await db.collection('students').findOne({ email: userEmail });
    if (!student && studentId) {
      try {
        student = await db.collection('students').findOne({ 
          user_id: new mongoose.Types.ObjectId(studentId) 
        });
      } catch (e) {}
    }
    
    if (!student) {
      console.log('No student found for badge check');
      return [];
    }
    
    // Get all active badges
    const allBadges = await db.collection('badges').find({ isActive: true }).toArray();
    const earnedBadgeIds = (student.badges || []).map(id => id.toString());
    const newlyEarned = [];
    
    for (const badge of allBadges) {
      // Skip if already earned
      if (earnedBadgeIds.includes(badge._id.toString())) continue;
      
      let earned = false;
      const criteriaValue = badge.criteriaValue || 0;
      
      switch (badge.criteriaType) {
        case 'quizzes_completed':
          earned = (student.total_quizzes || 0) >= criteriaValue;
          break;
        case 'points_earned':
          earned = (student.points || 0) >= criteriaValue;
          break;
        case 'login_streak':
          earned = (student.streak || 0) >= criteriaValue;
          break;
        case 'first_quiz':
          earned = (student.total_quizzes || 0) >= 1;
          break;
        case 'manual':
          // Only awarded manually by admin
          break;
        default:
          break;
      }
      
      if (earned) {
        // Award the badge
        await db.collection('students').updateOne(
          { _id: student._id },
          { 
            $addToSet: { badges: badge._id },
            $set: { [`badgeEarnedDates.${badge._id}`]: new Date() }
          }
        );
        
        // Increment badge earned count
        await db.collection('badges').updateOne(
          { _id: badge._id },
          { $inc: { earnedCount: 1 } }
        );
        
        newlyEarned.push(badge);
        console.log(`🏆 Badge awarded: ${badge.name} to ${student.email}`);
      }
    }
    
    return newlyEarned;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

function updateStreakOnCompletion(mathProfile) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (mathProfile.last_activity_date) {
    const lastActivity = new Date(mathProfile.last_activity_date);
    lastActivity.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      mathProfile.streak = (mathProfile.streak || 0) + 1;
    } else if (diffDays > 1) {
      mathProfile.streak = 1;
    }
  } else {
    mathProfile.streak = 1;
  }
  
  mathProfile.last_activity_date = new Date();
}

function generateQuestion(profile) {
  const operations = ["+", "-", "*", "/"];
  let maxNum, operation;

  if (profile <= 2) {
    maxNum = 10;
    operation = operations[Math.floor(Math.random() * 2)];
  } else if (profile <= 4) {
    maxNum = 20;
    operation = operations[Math.floor(Math.random() * 3)];
  } else if (profile <= 6) {
    maxNum = 50;
    operation = operations[Math.floor(Math.random() * 4)];
  } else if (profile <= 8) {
    maxNum = 100;
    operation = operations[Math.floor(Math.random() * 4)];
  } else {
    maxNum = 200;
    operation = operations[Math.floor(Math.random() * 4)];
  }

  let num1 = Math.floor(Math.random() * maxNum) + 1;
  let num2 = Math.floor(Math.random() * maxNum) + 1;
  let correct_answer;

  switch (operation) {
    case "+":
      correct_answer = num1 + num2;
      break;
    case "-":
      if (num1 < num2) [num1, num2] = [num2, num1];
      correct_answer = num1 - num2;
      break;
    case "*":
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      correct_answer = num1 * num2;
      break;
    case "/":
      num2 = Math.floor(Math.random() * 10) + 1;
      correct_answer = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * correct_answer;
      break;
    default:
      correct_answer = num1 + num2;
  }

  return {
    question_text: `${num1} ${operation} ${num2} = ?`,
    correct_answer,
    operation,
    difficulty: profile,
  };
}

// ==================== DASHBOARD ====================
router.get("/dashboard", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    
    let mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    if (!mathProfile) {
      mathProfile = new MathProfile({
        student_id: studentId,
        current_profile: 1,
        total_points: 0,
        streak: 0,
        placement_completed: false,
      });
      await mathProfile.save();
    }

    // Sync to students collection
    const db = mongoose.connection.db;
    await syncPointsToStudent(db, studentId, userEmail, mathProfile);

    const recentQuizzes = await Quiz.find({ student_id: studentId })
      .sort({ completed_at: -1 })
      .limit(5);

    res.json({
      success: true,
      profile: {
        current_level: mathProfile.current_profile,
        totalPoints: mathProfile.total_points || 0,
        streak: mathProfile.streak || 0,
        placement_completed: mathProfile.placement_completed,
      },
      stats: {
        points: mathProfile.total_points || 0,
        level: mathProfile.current_profile,
        streak: mathProfile.streak || 0,
      },
      recentQuizzes: recentQuizzes.map((q) => ({
        id: q._id,
        type: q.quiz_type,
        score: q.score,
        percentage: q.percentage,
        completed_at: q.completed_at,
      })),
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ success: false, error: "Failed to load dashboard" });
  }
});

// ==================== PLACEMENT QUIZ ====================
router.post("/placement/start", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    let mathProfile = await MathProfile.findOne({ student_id: studentId });

    if (!mathProfile) {
      mathProfile = new MathProfile({
        student_id: studentId,
        current_profile: 1,
        total_points: 0,
        placement_completed: false,
      });
      await mathProfile.save();
    }

    if (mathProfile.placement_completed) {
      return res.status(400).json({
        success: false,
        error: "Placement quiz already completed",
        profile: mathProfile.current_profile,
      });
    }

    const startingProfile = 5;
    const questions = [];
    for (let i = 0; i < 15; i++) {
      questions.push(generateQuestion(startingProfile));
    }

    const quiz = new Quiz({
      student_id: studentId,
      quiz_type: "placement",
      profile_level: startingProfile,
      questions,
      score: 0,
      percentage: 0,
      points_earned: 0,
    });
    await quiz.save();

    res.json({
      success: true,
      quiz_id: quiz._id,
      questions: questions.map((q) => ({
        question_text: q.question_text,
        operation: q.operation,
      })),
      total_questions: 15,
    });
  } catch (error) {
    console.error("❌ Start placement error:", error);
    res.status(500).json({ success: false, error: "Failed to start placement" });
  }
});

router.post("/placement/submit", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    const { quiz_id, answers } = req.body;

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "placement") {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      const studentAnswer = answers[i];
      q.student_answer = studentAnswer;
      q.is_correct = studentAnswer === q.correct_answer;
      if (q.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / 15) * 100);
    quiz.points_earned = score * 10;
    quiz.completed_at = new Date();
    await quiz.save();

    let startingProfile;
    const percentage = quiz.percentage;
    if (percentage >= 90) startingProfile = 8;
    else if (percentage >= 80) startingProfile = 7;
    else if (percentage >= 70) startingProfile = 6;
    else if (percentage >= 60) startingProfile = 5;
    else if (percentage >= 50) startingProfile = 4;
    else if (percentage >= 40) startingProfile = 3;
    else if (percentage >= 30) startingProfile = 2;
    else startingProfile = 1;

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    mathProfile.current_profile = startingProfile;
    mathProfile.placement_completed = true;
    mathProfile.total_points += quiz.points_earned;
    updateStreakOnCompletion(mathProfile);
    await mathProfile.save();

    // Sync to students collection
    const db = mongoose.connection.db;
    await syncPointsToStudent(db, studentId, userEmail, mathProfile);
    
    // Increment quiz count
    await db.collection('students').updateOne(
      { $or: [{ user_id: new mongoose.Types.ObjectId(studentId) }, { email: userEmail }] },
      { $inc: { total_quizzes: 1 } }
    );

    // Log transaction
    const student = await db.collection('students').findOne({ email: userEmail });
    await db.collection('point_transactions').insertOne({
      student_id: student?._id || studentId,
      amount: quiz.points_earned,
      reason: `Placement quiz completed - Score: ${quiz.percentage}%`,
      type: 'quiz_completion',
      previousBalance: mathProfile.total_points - quiz.points_earned,
      newBalance: mathProfile.total_points,
      createdAt: new Date()
    });

    // Check badges
    const earnedBadges = await checkAndAwardBadges(db, studentId, userEmail);

    console.log(`🎮 Placement completed: ${userEmail} earned ${quiz.points_earned} pts, profile: ${startingProfile}`);

    res.json({
      success: true,
      result: {
        score,
        total: 15,
        percentage: quiz.percentage,
        points_earned: quiz.points_earned,
        assigned_profile: startingProfile,
        new_badges: earnedBadges.map(b => ({ name: b.name, icon: b.icon }))
      },
    });
  } catch (error) {
    console.error("❌ Submit placement error:", error);
    res.status(500).json({ success: false, error: "Failed to submit placement" });
  }
});

// ==================== REGULAR QUIZ ====================
router.post("/quiz/start", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    let mathProfile = await MathProfile.findOne({ student_id: studentId });

    if (!mathProfile) {
      mathProfile = new MathProfile({
        student_id: studentId,
        current_profile: 1,
        total_points: 0,
        placement_completed: false,
      });
      await mathProfile.save();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastQuizDate = mathProfile.last_quiz_date
      ? new Date(mathProfile.last_quiz_date)
      : null;

    if (lastQuizDate) {
      lastQuizDate.setHours(0, 0, 0, 0);
      if (lastQuizDate.getTime() !== today.getTime()) {
        mathProfile.quizzes_today = 0;
        mathProfile.last_quiz_date = new Date();
      }
    } else {
      mathProfile.last_quiz_date = new Date();
    }

    const profile = mathProfile.current_profile;
    const questions = [];
    for (let i = 0; i < 15; i++) {
      questions.push(generateQuestion(profile));
    }

    const quiz = new Quiz({
      student_id: studentId,
      quiz_type: "regular",
      profile_level: profile,
      questions,
      score: 0,
      percentage: 0,
      points_earned: 0,
    });
    await quiz.save();

    mathProfile.quizzes_today += 1;
    await mathProfile.save();

    res.json({
      success: true,
      quiz_id: quiz._id,
      profile,
      questions: questions.map((q) => ({ question_text: q.question_text, operation: q.operation })),
      total_questions: 15,
      attemptsToday: mathProfile.quizzes_today,
    });
  } catch (error) {
    console.error("❌ Generate quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to generate quiz" });
  }
});

// FIXED: Quiz submit with proper error handling
router.post("/quiz/submit", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    const { quiz_id, answers } = req.body;

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || quiz.quiz_type !== "regular") {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      const studentAnswer = answers[i];
      q.student_answer = studentAnswer;
      q.is_correct = studentAnswer === q.correct_answer;
      if (q.is_correct) score++;
    });

    quiz.score = score;
    quiz.percentage = Math.round((score / 15) * 100);
    quiz.points_earned = score * 10;
    quiz.completed_at = new Date();
    await quiz.save();

    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    const oldProfile = mathProfile.current_profile;

    let newProfile = oldProfile;
    let profileChanged = false;
    let changeType = null;

    if (quiz.percentage >= 70) {
      mathProfile.consecutive_fails = 0;
      if (mathProfile.current_profile < 10) {
        newProfile = mathProfile.current_profile + 1;
        mathProfile.current_profile = newProfile;
        profileChanged = true;
        changeType = "advance";
      }
    } else if (quiz.percentage < 50) {
      mathProfile.consecutive_fails += 1;
      if (mathProfile.consecutive_fails >= 6 && mathProfile.current_profile > 1) {
        newProfile = mathProfile.current_profile - 1;
        mathProfile.current_profile = newProfile;
        mathProfile.consecutive_fails = 0;
        profileChanged = true;
        changeType = "demote";
      }
    } else {
      mathProfile.consecutive_fails = 0;
    }

    mathProfile.total_points += quiz.points_earned;
    updateStreakOnCompletion(mathProfile);
    await mathProfile.save();

    // ============ SYNC TO STUDENTS COLLECTION ============
    const db = mongoose.connection.db;
    
    // Sync points to students collection
    await syncPointsToStudent(db, studentId, userEmail, mathProfile);
    
    // Increment quiz count
    await db.collection('students').updateOne(
      { $or: [{ user_id: new mongoose.Types.ObjectId(studentId) }, { email: userEmail }] },
      { $inc: { total_quizzes: 1 } }
    );

    // Get student for transaction logging
    const student = await db.collection('students').findOne({ 
      $or: [{ user_id: new mongoose.Types.ObjectId(studentId) }, { email: userEmail }] 
    });

    // Log point transaction
    await db.collection('point_transactions').insertOne({
      student_id: student?._id || studentId,
      amount: quiz.points_earned,
      reason: `Quiz completed - Score: ${quiz.percentage}%`,
      type: 'quiz_completion',
      previousBalance: mathProfile.total_points - quiz.points_earned,
      newBalance: mathProfile.total_points,
      createdAt: new Date()
    });

    // Check and award badges
    const earnedBadges = await checkAndAwardBadges(db, studentId, userEmail);
    
    console.log(`🎮 Quiz completed: ${userEmail} earned ${quiz.points_earned} pts (total: ${mathProfile.total_points})`);
    if (earnedBadges.length > 0) {
      console.log(`🏆 New badges earned: ${earnedBadges.map(b => b.name).join(', ')}`);
    }

    res.json({
      success: true,
      result: {
        score,
        total: 15,
        percentage: quiz.percentage,
        points_earned: quiz.points_earned,
        old_profile: oldProfile,
        new_profile: newProfile,
        profile_changed: profileChanged,
        change_type: changeType,
        total_points: mathProfile.total_points,
        new_badges: earnedBadges.map(b => ({ name: b.name, icon: b.icon }))
      },
    });
  } catch (error) {
    console.error("❌ Submit quiz error:", error);
    res.status(500).json({ success: false, error: "Failed to submit quiz" });
  }
});

// ==================== QUIZ HISTORY ====================
router.get("/quiz-history", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const quizzes = await Quiz.find({ student_id: studentId, completed_at: { $ne: null } })
      .sort({ completed_at: -1 })
      .limit(20);

    const totalPoints = quizzes.reduce((sum, q) => sum + (q.points_earned || 0), 0);
    const avgScore = quizzes.length > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length)
      : 0;

    res.json({
      success: true,
      quizzes: quizzes.map((q) => ({
        id: q._id,
        type: q.quiz_type,
        profile_level: q.profile_level,
        score: q.score,
        percentage: q.percentage,
        points_earned: q.points_earned,
        completed_at: q.completed_at,
      })),
      summary: {
        total_quizzes: quizzes.length,
        total_points: totalPoints,
        average_score: avgScore,
      },
    });
  } catch (error) {
    console.error("❌ Get quiz history error:", error);
    res.status(500).json({ success: false, error: "Failed to load history" });
  }
});

router.get("/quiz/:id/details", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz._id,
        type: quiz.quiz_type,
        profile_level: quiz.profile_level,
        score: quiz.score,
        percentage: quiz.percentage,
        points_earned: quiz.points_earned,
        completed_at: quiz.completed_at,
        questions: quiz.questions.map((q) => ({
          question_text: q.question_text,
          correct_answer: q.correct_answer,
          student_answer: q.student_answer,
          is_correct: q.is_correct,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load quiz" });
  }
});

// ==================== LEADERBOARD ====================
router.get("/leaderboard", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const profiles = await MathProfile.find({}).sort({ total_points: -1 }).limit(10);

    const leaderboard = await Promise.all(
      profiles.map(async (p, index) => {
        const user = await db.collection("users").findOne({ _id: p.student_id });
        return {
          rank: index + 1,
          name: user?.name || "Unknown",
          points: p.total_points,
          level: p.current_profile,
        };
      })
    );

    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
});

// ==================== TRACK PROGRESS ====================
router.get("/progress", async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    const mathProfile = await MathProfile.findOne({ student_id: studentId });

    if (!mathProfile) {
      return res.json({
        success: true,
        progress: { level: 1, points: 0, streak: 0, quizzes: 0 }
      });
    }

    // Sync points first
    const db = mongoose.connection.db;
    await syncPointsToStudent(db, studentId, userEmail, mathProfile);

    const quizCount = await Quiz.countDocuments({ student_id: studentId, completed_at: { $ne: null } });
    
    res.json({
      success: true,
      progress: {
        level: mathProfile.current_profile,
        points: mathProfile.total_points,
        streak: mathProfile.streak || 0,
        quizzes: quizCount,
        placement_completed: mathProfile.placement_completed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load progress" });
  }
});

// ==================== BADGES - FIXED ====================
router.get("/badges", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    
    console.log('🏆 Fetching badges for:', userEmail);
    
    // Find or create student record
    let student = await db.collection('students').findOne({ email: userEmail });
    
    if (!student) {
      // Try by user_id
      try {
        student = await db.collection('students').findOne({ 
          user_id: new mongoose.Types.ObjectId(studentId) 
        });
      } catch (e) {}
    }
    
    // If still no student, sync from mathprofile
    if (!student) {
      const mathProfile = await MathProfile.findOne({ student_id: studentId });
      if (mathProfile) {
        await syncPointsToStudent(db, studentId, userEmail, mathProfile);
        student = await db.collection('students').findOne({ email: userEmail });
      }
    }
    
    // Get all active badges
    const allBadges = await db.collection('badges').find({ isActive: true }).toArray();
    
    if (!student) {
      console.log('❌ No student record found, returning all badges as unearned');
      return res.json({
        success: true,
        badges: allBadges.map(b => ({ ...b, earned: false, earnedAt: null })),
        earnedBadges: [],
        totalPoints: 0
      });
    }
    
    const earnedBadgeIds = (student.badges || []).map(id => id.toString());
    
    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.includes(badge._id.toString()),
      earnedAt: student.badgeEarnedDates?.[badge._id.toString()] || null
    }));
    
    console.log(`✅ Found ${allBadges.length} badges, ${earnedBadgeIds.length} earned`);
    
    res.json({
      success: true,
      badges: badgesWithStatus,
      earnedBadges: badgesWithStatus.filter(b => b.earned),
      totalPoints: student.points || 0
    });
  } catch (error) {
    console.error("❌ Get badges error:", error);
    res.status(500).json({ success: false, error: "Failed to load badges" });
  }
});

router.get("/badges/all", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const badges = await db.collection('badges').find({ isActive: true }).toArray();
    res.json({ success: true, badges });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load badges" });
  }
});

// ==================== POINTS - FIXED ====================
router.get("/points", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    
    // Get mathprofile (source of truth for points)
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    
    if (mathProfile) {
      // Sync to students collection
      await syncPointsToStudent(db, studentId, userEmail, mathProfile);
      
      return res.json({
        success: true,
        points: mathProfile.total_points || 0,
        level: mathProfile.current_profile || 1
      });
    }
    
    // Fallback to students collection
    const student = await db.collection('students').findOne({ 
      $or: [{ user_id: new mongoose.Types.ObjectId(studentId) }, { email: userEmail }]
    });
    
    if (student) {
      return res.json({
        success: true,
        points: student.points || 0,
        level: student.level || 1
      });
    }
    
    return res.json({ success: true, points: 0, level: 1 });
  } catch (error) {
    console.error("❌ Get points error:", error);
    res.status(500).json({ success: false, error: "Failed to load points" });
  }
});

router.get("/points/history", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userEmail = req.user.email;
    
    const student = await db.collection('students').findOne({ email: userEmail });
    
    if (!student) {
      return res.json({ success: true, transactions: [] });
    }
    
    const transactions = await db.collection('point_transactions')
      .find({ student_id: student._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load history" });
  }
});

// ==================== SHOP - FIXED ====================
router.get("/shop", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;
    
    // Get student points - try multiple ways
    let studentPoints = 0;
    
    // First try mathprofile (source of truth)
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (mathProfile) {
      studentPoints = mathProfile.total_points || 0;
      // Sync to students collection
      await syncPointsToStudent(db, studentId, userEmail, mathProfile);
    } else {
      // Fallback to students collection
      const student = await db.collection('students').findOne({ 
        $or: [{ user_id: new mongoose.Types.ObjectId(studentId) }, { email: userEmail }]
      });
      studentPoints = student?.points || 0;
    }
    
    // Get student's purchases
    const student = await db.collection('students').findOne({ email: userEmail });
    const purchases = student 
      ? await db.collection('purchases').find({ student_id: student._id }).toArray()
      : [];
    const purchasedIds = purchases.map(p => p.item_id.toString());
    
    // Get shop items
    const items = await db.collection('shop_items').find({ isActive: true }).sort({ cost: 1 }).toArray();
    
    const itemsWithStatus = items.map(item => ({
      ...item,
      owned: purchasedIds.includes(item._id.toString()),
      canAfford: studentPoints >= item.cost
    }));
    
    console.log(`🛒 Shop: ${items.length} items, student has ${studentPoints} points`);
    
    res.json({ success: true, items: itemsWithStatus, studentPoints });
  } catch (error) {
    console.error("❌ Get shop items error:", error);
    res.status(500).json({ success: false, error: "Failed to load shop items" });
  }
});

router.post("/shop/purchase", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { itemId } = req.body;
    const studentId = req.user.userId || req.user.id;
    const userEmail = req.user.email;

    if (!itemId) {
      return res.status(400).json({ success: false, error: "Item ID required" });
    }

    // Get current points from mathprofile
    const mathProfile = await MathProfile.findOne({ student_id: studentId });
    if (!mathProfile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }
    
    const currentPoints = mathProfile.total_points || 0;

    // Get item
    const item = await db.collection('shop_items').findOne({ _id: new mongoose.Types.ObjectId(itemId) });
    if (!item || !item.isActive) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    // Get or create student record
    let student = await db.collection('students').findOne({ email: userEmail });
    if (!student) {
      await syncPointsToStudent(db, studentId, userEmail, mathProfile);
      student = await db.collection('students').findOne({ email: userEmail });
    }

    if (!student) {
      return res.status(404).json({ success: false, error: "Student record not found" });
    }

    // Check if already owned
    const existingPurchase = await db.collection('purchases').findOne({
      student_id: student._id,
      item_id: new mongoose.Types.ObjectId(itemId)
    });

    if (existingPurchase) {
      return res.status(400).json({ success: false, error: "You already own this item" });
    }

    // Check if can afford
    if (currentPoints < item.cost) {
      return res.status(400).json({ 
        success: false, 
        error: `Not enough points. You have ${currentPoints}, need ${item.cost}` 
      });
    }

    // Deduct points from mathprofile
    const newPoints = currentPoints - item.cost;
    mathProfile.total_points = newPoints;
    await mathProfile.save();
    
    // Sync to students collection
    await db.collection('students').updateOne(
      { _id: student._id },
      { $set: { points: newPoints, updated_at: new Date() } }
    );

    // Record purchase
    await db.collection('purchases').insertOne({
      student_id: student._id,
      item_id: new mongoose.Types.ObjectId(itemId),
      item_name: item.name,
      cost: item.cost,
      purchasedAt: new Date()
    });

    // Update item purchase count
    await db.collection('shop_items').updateOne(
      { _id: new mongoose.Types.ObjectId(itemId) },
      { $inc: { purchaseCount: 1 } }
    );

    // Log transaction
    await db.collection('point_transactions').insertOne({
      student_id: student._id,
      amount: -item.cost,
      reason: `Purchased: ${item.name}`,
      type: 'purchase',
      previousBalance: currentPoints,
      newBalance: newPoints,
      createdAt: new Date()
    });

    console.log(`🛒 Purchase: ${userEmail} bought ${item.name} for ${item.cost} pts`);

    res.json({ success: true, message: `Successfully purchased ${item.name}!`, newPoints });
  } catch (error) {
    console.error("❌ Purchase item error:", error);
    res.status(500).json({ success: false, error: "Failed to purchase item" });
  }
});

router.get("/shop/purchases", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userEmail = req.user.email;
    
    const student = await db.collection('students').findOne({ email: userEmail });
    if (!student) {
      return res.json({ success: true, purchases: [] });
    }

    const purchases = await db.collection('purchases')
      .find({ student_id: student._id })
      .sort({ purchasedAt: -1 })
      .toArray();

    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load purchases" });
  }
});

// ==================== ANNOUNCEMENTS ====================
router.get("/announcements", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const now = new Date();
    
    const announcements = await db.collection('announcements')
      .find({
        $and: [
          { $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] },
          { $or: [{ audience: 'all' }, { audience: 'student' }, { audience: 'students' }, { audience: { $exists: false } }] }
        ]
      })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(10)
      .toArray();
    
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load announcements" });
  }
});

// ==================== SUPPORT TICKETS ====================
router.post("/support-tickets", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { subject, description, priority, category } = req.body;
    
    const ticket = {
      user_id: req.user.userId || req.user.id,
      user_email: req.user.email,
      user_name: req.user.name,
      user_role: 'student',
      subject,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('supporttickets').insertOne(ticket);
    res.json({ success: true, ticket: { ...ticket, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to create ticket" });
  }
});

router.get("/support-tickets", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const tickets = await db.collection('supporttickets')
      .find({ user_email: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to load tickets" });
  }
});

module.exports = router;
