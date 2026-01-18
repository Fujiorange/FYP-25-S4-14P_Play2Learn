// routes/mongoStudentRoutes.js
// MongoDB Student Routes for Play2Learn - COMPLETE WITH QUIZ SYSTEM

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==================== HELPER FUNCTIONS ====================

// Get today's date at midnight (Singapore Time - UTC+8)
function getTodayMidnight() {
  const now = new Date();
  // Convert to Singapore time
  const sgTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  sgTime.setHours(0, 0, 0, 0);
  return sgTime;
}

// Generate random math question based on profile
function generateQuestion(profile, operation) {
  const ranges = {
    1: [1, 10], 2: [1, 20], 3: [1, 30], 4: [1, 40], 5: [1, 50],
    6: [1, 60], 7: [1, 70], 8: [1, 80], 9: [1, 90], 10: [1, 100]
  };
  
  const [min, max] = ranges[profile] || [1, 10];
  
  const getRandomNum = () => Math.floor(Math.random() * (max - min + 1)) + min;
  
  let num1, num2, answer, questionText;
  
  switch (operation) {
    case 'addition':
      num1 = getRandomNum();
      num2 = getRandomNum();
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
      break;
      
    case 'subtraction':
      num1 = getRandomNum();
      num2 = getRandomNum();
      // Ensure num1 >= num2 for positive results
      if (num1 < num2) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      questionText = `${num1} - ${num2} = ?`;
      break;
      
    case 'multiplication':
      num1 = Math.floor(Math.random() * 12) + 1; // 1-12 for easier multiplication
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      questionText = `${num1} × ${num2} = ?`;
      break;
      
    case 'division':
      num2 = Math.floor(Math.random() * 12) + 1; // divisor 1-12
      answer = Math.floor(Math.random() * 12) + 1; // quotient 1-12
      num1 = num2 * answer; // ensure even division
      questionText = `${num1} ÷ ${num2} = ?`;
      break;
      
    default:
      num1 = getRandomNum();
      num2 = getRandomNum();
      answer = num1 + num2;
      questionText = `${num1} + ${num2} = ?`;
  }
  
  return { questionText, answer, operation };
}


// ==================== HELPER FUNCTIONS ====================

// Calculate current streak from quiz attempts
function calculateStreak(quizAttempts) {
  if (!quizAttempts || quizAttempts.length === 0) return 0;
  
  // Get current date in Singapore timezone
  const now = new Date();
  const sgTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  
  let streak = 0;
  let checkDate = new Date(sgTime);
  checkDate.setHours(0, 0, 0, 0);
  
  // Check up to 365 days back (max 1 year streak)
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(checkDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Check if there's at least one quiz attempt on this day
    const hasQuizOnThisDay = quizAttempts.some(attempt => {
      const attemptDate = new Date(attempt.created_at);
      return attemptDate >= dayStart && attemptDate <= dayEnd;
    });
    
    if (hasQuizOnThisDay) {
      streak++;
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Streak broken - no quiz on this day
      break;
    }
  }
  
  return streak;
}

// Update math skills based on quiz performance
async function updateMathSkills(db, studentId, questions, answers) {
  try {
    console.log('📊 Updating math skills for student:', studentId);
    
    // Analyze performance by operation
    const operationStats = {
      addition: { correct: 0, total: 0 },
      subtraction: { correct: 0, total: 0 },
      multiplication: { correct: 0, total: 0 },
      division: { correct: 0, total: 0 }
    };

    // Calculate stats for each operation
    questions.forEach((question, idx) => {
      const operation = question.operation;
      const userAnswer = parseInt(answers[idx]);
      const correct = userAnswer === question.answer;
      
      if (operationStats[operation]) {
        operationStats[operation].total++;
        if (correct) {
          operationStats[operation].correct++;
        }
      }
    });

    console.log('📈 Operation stats:', operationStats);

    // Get or create student skills
    let skills = await db.collection('math_skills').findOne({ student_id: studentId });
    
    if (!skills) {
      skills = {
        student_id: studentId,
        addition: { current_level: 0, xp: 0, max_level: 5 },
        subtraction: { current_level: 0, xp: 0, max_level: 5 },
        multiplication: { current_level: 0, xp: 0, max_level: 5 },
        division: { current_level: 0, xp: 0, max_level: 5 },
        created_at: new Date(),
        updated_at: new Date()
      };
      await db.collection('math_skills').insertOne(skills);
    }

    // XP calculation and level thresholds
    const xpPerCorrect = 10; // 10 XP per correct answer
    const levelThresholds = [0, 50, 100, 150, 200, 250]; // Level 0->1: 50 XP, etc.

    // Update each operation
    for (const [operation, stats] of Object.entries(operationStats)) {
      if (stats.total === 0) continue; // Skip if no questions for this operation
      
      const currentSkill = skills[operation] || { current_level: 0, xp: 0, max_level: 5 };
      const xpGained = stats.correct * xpPerCorrect;
      const newXP = (currentSkill.xp || 0) + xpGained;
      
      // Calculate new level based on XP
      let newLevel = 0;
      for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (newXP >= levelThresholds[i]) {
          newLevel = i;
          break;
        }
      }
      
      // Cap at max level
      if (newLevel > 5) newLevel = 5;
      
      const oldLevel = currentSkill.current_level || 0;
      const leveledUp = newLevel > oldLevel;
      
      console.log(`  ${operation}: ${stats.correct}/${stats.total} correct, +${xpGained} XP, ${currentSkill.xp || 0} -> ${newXP} XP, Level ${oldLevel} -> ${newLevel}${leveledUp ? ' 🎉' : ''}`);
      
      // Update in database
      await db.collection('math_skills').updateOne(
        { student_id: studentId },
        { 
          $set: {
            [`${operation}.xp`]: newXP,
            [`${operation}.current_level`]: newLevel,
            [`${operation}.max_level`]: 5,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    }

    console.log('✅ Math skills updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating math skills:', error);
    // Don't throw error - skills update failure shouldn't break quiz submission
  }
}


// ==================== PLACEMENT QUIZ ====================

router.post('/placement-quiz/generate', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Check if already completed placement quiz
    if (student.placement_completed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Placement quiz already completed. You are at Profile ' + student.current_profile 
      });
    }

    // Generate 15 placement questions (mix of all difficulty levels)
    const questions = [];
    
    // 5 easy (Profile 1-3): Addition & Subtraction
    for (let i = 0; i < 3; i++) {
      questions.push(generateQuestion(1, 'addition'));
    }
    for (let i = 0; i < 2; i++) {
      questions.push(generateQuestion(2, 'subtraction'));
    }
    
    // 5 medium (Profile 4-6): All operations
    questions.push(generateQuestion(4, 'addition'));
    questions.push(generateQuestion(5, 'subtraction'));
    questions.push(generateQuestion(6, 'multiplication'));
    questions.push(generateQuestion(6, 'division'));
    questions.push(generateQuestion(6, 'addition'));
    
    // 5 hard (Profile 7-10): All operations
    questions.push(generateQuestion(8, 'multiplication'));
    questions.push(generateQuestion(8, 'division'));
    questions.push(generateQuestion(9, 'addition'));
    questions.push(generateQuestion(10, 'subtraction'));
    questions.push(generateQuestion(10, 'multiplication'));

    // Shuffle questions
    questions.sort(() => Math.random() - 0.5);

    // Store quiz in database
    const quizData = {
      student_id: student._id,
      quiz_type: 'placement',
      questions: questions,
      status: 'in_progress',
      created_at: new Date()
    };

    const result = await db.collection('active_quizzes').insertOne(quizData);

    res.json({
      success: true,
      quiz_id: result.insertedId.toString(),
      questions: questions.map((q, idx) => ({
        question_number: idx + 1,
        question_text: q.questionText,
        operation: q.operation
      })),
      total_questions: 15
    });

  } catch (error) {
    console.error('Generate placement quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate placement quiz' });
  }
});

router.post('/placement-quiz/submit', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { quiz_id, answers } = req.body; // answers = [1, 5, 10, ...] (15 numbers)

    if (!quiz_id || !answers || answers.length !== 15) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid submission: quiz_id and 15 answers required' 
      });
    }

    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (student.placement_completed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Placement quiz already completed' 
      });
    }

    // Get quiz from database
    const quiz = await db.collection('active_quizzes').findOne({ 
      _id: new mongoose.Types.ObjectId(quiz_id),
      student_id: student._id,
      quiz_type: 'placement'
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    // Grade the quiz
    let correctAnswers = 0;
    answers.forEach((answer, idx) => {
      if (parseInt(answer) === quiz.questions[idx].answer) {
        correctAnswers++;
      }
    });

    const percentage = Math.round((correctAnswers / 15) * 100);

    // Determine starting profile based on score
    let startingProfile = 1;
    if (percentage >= 90) startingProfile = 10;
    else if (percentage >= 85) startingProfile = 9;
    else if (percentage >= 80) startingProfile = 8;
    else if (percentage >= 75) startingProfile = 7;
    else if (percentage >= 70) startingProfile = 6;
    else if (percentage >= 60) startingProfile = 5;
    else if (percentage >= 50) startingProfile = 4;
    else if (percentage >= 40) startingProfile = 3;
    else if (percentage >= 30) startingProfile = 2;
    else startingProfile = 1;

    // Update student record
    await db.collection('students').updateOne(
      { _id: student._id },
      { 
        $set: { 
          current_profile: startingProfile,
          placement_completed: true,
          consecutive_fails: 0,
          updated_at: new Date()
        }
      }
    );

    // Save quiz result
    await db.collection('quiz_attempts').insertOne({
      student_id: student._id,
      quiz_type: 'placement',
      profile_level: startingProfile,
      score: correctAnswers,
      total_questions: 15,
      percentage: percentage,
      answers: answers,
      created_at: new Date()
    });

    // Delete active quiz
    await db.collection('active_quizzes').deleteOne({ _id: quiz._id });

    res.json({
      success: true,
      message: 'Placement quiz completed successfully!',
      result: {
        score: correctAnswers,
        total: 15,
        percentage: percentage,
        assigned_profile: startingProfile
      }
    });

  } catch (error) {
    console.error('Submit placement quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit placement quiz' });
  }
});

// ==================== REGULAR QUIZ (AFTER PLACEMENT) ====================

router.post('/quiz/generate', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Check if placement quiz completed
    if (!student.placement_completed || !student.current_profile) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please complete placement quiz first',
        requiresPlacement: true
      });
    }

    // Check daily limit (2 attempts per day, resets at midnight SGT)
    const todayMidnight = getTodayMidnight();
    
    const attemptsToday = await db.collection('quiz_attempts').countDocuments({
      student_id: student._id,
      quiz_type: { $ne: 'placement' },
      created_at: { $gte: todayMidnight }
    });

    if (attemptsToday >= 2) {
      return res.status(429).json({ 
        success: false, 
        error: 'Daily quiz limit reached (2/2). Come back tomorrow!',
        attemptsToday: 2,
        nextAvailableTime: 'Tomorrow at 12:00 AM SGT'
      });
    }

    const currentProfile = student.current_profile;

    // Determine operations based on profile
    const operations = currentProfile >= 6 
      ? ['addition', 'subtraction', 'multiplication', 'division']
      : ['addition', 'subtraction'];

    // Generate 15 questions
    const questions = [];
    
    if (currentProfile >= 6) {
      // Profiles 6-10: 25% each operation (4+4+4+3 = 15)
      for (let i = 0; i < 4; i++) questions.push(generateQuestion(currentProfile, 'addition'));
      for (let i = 0; i < 4; i++) questions.push(generateQuestion(currentProfile, 'subtraction'));
      for (let i = 0; i < 4; i++) questions.push(generateQuestion(currentProfile, 'multiplication'));
      for (let i = 0; i < 3; i++) questions.push(generateQuestion(currentProfile, 'division'));
    } else {
      // Profiles 1-5: 50% addition, 50% subtraction (8+7 = 15)
      for (let i = 0; i < 8; i++) questions.push(generateQuestion(currentProfile, 'addition'));
      for (let i = 0; i < 7; i++) questions.push(generateQuestion(currentProfile, 'subtraction'));
    }

    // Shuffle questions
    questions.sort(() => Math.random() - 0.5);

    // Store quiz in database
    const quizData = {
      student_id: student._id,
      quiz_type: 'regular',
      profile_level: currentProfile,
      questions: questions,
      status: 'in_progress',
      created_at: new Date()
    };

    const result = await db.collection('active_quizzes').insertOne(quizData);

    res.json({
      success: true,
      quiz_id: result.insertedId.toString(),
      profile: currentProfile,
      questions: questions.map((q, idx) => ({
        question_number: idx + 1,
        question_text: q.questionText,
        operation: q.operation
      })),
      total_questions: 15,
      attemptsToday: attemptsToday + 1,
      attemptsRemaining: 1 - attemptsToday
    });

  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate quiz' });
  }
});

router.post('/quiz/submit', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { quiz_id, answers } = req.body;

    if (!quiz_id || !answers || answers.length !== 15) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid submission: quiz_id and 15 answers required' 
      });
    }

    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Get quiz from database
    const quiz = await db.collection('active_quizzes').findOne({ 
      _id: new mongoose.Types.ObjectId(quiz_id),
      student_id: student._id
    });

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found or already submitted' });
    }

    // Grade the quiz
    let correctAnswers = 0;
    answers.forEach((answer, idx) => {
      if (parseInt(answer) === quiz.questions[idx].answer) {
        correctAnswers++;
      }
    });

    const percentage = Math.round((correctAnswers / 15) * 100);
    const oldProfile = student.current_profile;
    let newProfile = oldProfile;
    let consecutiveFails = student.consecutive_fails || 0;
    let profileChanged = false;
    let changeType = 'stay';

    // ==================== ADVANCEMENT LOGIC ====================
    
    if (percentage >= 70) {
      // ⬆️ ADVANCE to next profile
      if (oldProfile < 10) {
        newProfile = oldProfile + 1;
        profileChanged = true;
        changeType = 'advance';
      }
      consecutiveFails = 0; // Reset fail counter
      
    } else if (percentage >= 50) {
      // 🔄 STAY at current profile
      consecutiveFails = 0; // Reset fail counter
      changeType = 'stay';
      
    } else {
      // ❌ SCORE < 50% - Increment fail counter
      consecutiveFails += 1;
      
      if (consecutiveFails >= 6 && oldProfile > 1) {
        // ⬇️ DEMOTE to lower profile after 6 consecutive fails
        newProfile = oldProfile - 1;
        profileChanged = true;
        changeType = 'demote';
        consecutiveFails = 0; // Reset after demotion
      } else {
        changeType = 'stay';
      }
    }

    // Update student record
    await db.collection('students').updateOne(
      { _id: student._id },
      { 
        $set: { 
          current_profile: newProfile,
          consecutive_fails: consecutiveFails,
          updated_at: new Date()
        },
        $inc: { 
          total_quizzes: 1,
          points: correctAnswers * 10 // 10 points per correct answer
        }
      }
    );

    // Save quiz attempt
    await db.collection('quiz_attempts').insertOne({
      student_id: student._id,
      quiz_type: 'regular',
      profile_level: oldProfile,
      score: correctAnswers,
      total_questions: 15,
      percentage: percentage,
      answers: answers,
      profile_change: profileChanged ? changeType : null,
      old_profile: oldProfile,
      new_profile: newProfile,
      created_at: new Date()
    });

    // Delete active quiz
    await db.collection('active_quizzes').deleteOne({ _id: quiz._id });

    // ⭐ Update math skills based on quiz performance
    await updateMathSkills(db, student._id, quiz.questions, answers);

    res.json({
      success: true,
      message: 'Quiz submitted successfully!',
      result: {
        score: correctAnswers,
        total: 15,
        percentage: percentage,
        old_profile: oldProfile,
        new_profile: newProfile,
        profile_changed: profileChanged,
        change_type: changeType,
        consecutive_fails: consecutiveFails,
        points_earned: correctAnswers * 10
      }
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit quiz' });
  }
});

// ==================== DASHBOARD ====================

router.get('/dashboard', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    console.log('📊 Dashboard request for userId:', userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      console.log('❌ Student not found');
      return res.json({
        success: true,
        totalPoints: 0,
        level: 1,
        currentLevel: 1,
        currentProfile: null,
        placementCompleted: false,
        streak: 0,
        currentStreak: 0,
        completedQuizzes: 0,
        totalQuizzes: 0,
        averageScore: 0,
        classRank: '#-',
        consecutiveFails: 0,
        studentName: 'Unknown',
        studentEmail: req.user.email
      });
    }

    console.log('✅ Student found:', student.name);

    const totalQuizzes = await db.collection('quiz_attempts').countDocuments({
      student_id: student._id,
      quiz_type: { $ne: 'placement' }
    });

    console.log('📝 Total quizzes found:', totalQuizzes);

    const quizAttempts = await db.collection('quiz_attempts').find({
      student_id: student._id,
      quiz_type: { $ne: 'placement' }
    }).toArray();

    let totalPoints = 0;
    quizAttempts.forEach(attempt => {
      const points = (attempt.score || 0) * 10;
      totalPoints += points;
    });

    console.log('⭐ Total points calculated:', totalPoints);

    const averageScore = totalQuizzes > 0 
      ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.percentage || 0), 0) / totalQuizzes)
      : 0;

    console.log('📊 Average score:', averageScore + '%');

    // Calculate current level (based on total points)
    const currentLevel = Math.floor(totalPoints / 500) + 1;

    // ⭐ Calculate current streak
    const currentStreak = calculateStreak(quizAttempts);
    console.log('🔥 Current streak:', currentStreak + ' days');

    const dashboardData = {
      success: true,
      studentName: student.name,
      studentEmail: req.user.email,
      totalPoints: totalPoints,
      completedQuizzes: totalQuizzes,
      totalQuizzes: totalQuizzes,
      averageScore: averageScore,
      currentProfile: student.current_profile || 1,
      currentLevel: currentLevel,
      level: currentLevel,
      currentStreak: currentStreak,  // ✅ Now calculated!
      streak: currentStreak,          // ✅ Now calculated!
      consecutiveFails: student.consecutive_fails || 0,
      placementCompleted: student.placement_completed || false,
      gradeLevel: student.grade_level || 'Primary 1',
      classRank: '#-'
    };

    console.log('📤 Sending dashboard data:', dashboardData);
    res.json(dashboardData);

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load dashboard data',
      details: error.message 
    });
  }
});


// ==================== MATH PROFILE ====================
router.get('/math-profile', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    console.log('📊 Math profile request for userId:', userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (!student.placement_completed || !student.current_profile) {
      return res.json({
        success: true,
        requiresPlacement: true,
        profile: null
      });
    }

    const currentProfile = student.current_profile;
    
    const profileConfig = {
      1: { range: [1, 10], ops: ['addition', 'subtraction'] },
      2: { range: [1, 20], ops: ['addition', 'subtraction'] },
      3: { range: [1, 30], ops: ['addition', 'subtraction'] },
      4: { range: [1, 40], ops: ['addition', 'subtraction'] },
      5: { range: [1, 50], ops: ['addition', 'subtraction'] },
      6: { range: [1, 60], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      7: { range: [1, 70], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      8: { range: [1, 80], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      9: { range: [1, 90], ops: ['addition', 'subtraction', 'multiplication', 'division'] },
      10: { range: [1, 100], ops: ['addition', 'subtraction', 'multiplication', 'division'] }
    };

    const config = profileConfig[currentProfile];
    
    const todayMidnight = getTodayMidnight();
    
    const attemptsToday = await db.collection('quiz_attempts').countDocuments({
      student_id: student._id,
      quiz_type: { $ne: 'placement' },
      created_at: { $gte: todayMidnight }
    });

    const totalQuizzes = await db.collection('quiz_attempts').countDocuments({
      student_id: student._id,
      quiz_type: { $ne: 'placement' }
    });

    console.log('📝 Total quizzes found:', totalQuizzes);

    const allQuizzes = await db.collection('quiz_attempts')
      .find({ 
        student_id: student._id, 
        quiz_type: { $ne: 'placement' } 
      })
      .toArray();

    const averageScore = totalQuizzes > 0 
      ? Math.round(allQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / totalQuizzes)
      : 0;

    console.log('📊 Average score:', averageScore + '%');

    const lastQuiz = await db.collection('quiz_attempts')
      .find({ student_id: student._id, quiz_type: { $ne: 'placement' } })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

    const quizHistory = allQuizzes
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(quiz => ({
        date: new Date(quiz.created_at).toLocaleDateString('en-SG'),
        profile_level: quiz.profile_level || currentProfile,
        score: quiz.score,
        total: quiz.total_questions || 15,
        percentage: quiz.percentage
      }));

    console.log('📤 Sending math profile data');

    res.json({
      success: true,
      requiresPlacement: false,
      profile: {
        current_profile: currentProfile,
        profile_name: `Profile ${currentProfile}`,
        number_range_min: config.range[0],
        number_range_max: config.range[1],
        operations: config.ops,
        pass_threshold: 70,
        fail_threshold: 50,
        attemptsToday: attemptsToday,
        attemptsRemaining: 2 - attemptsToday,
        consecutiveFails: student.consecutive_fails || 0,
        totalQuizzes: totalQuizzes,
        averageScore: averageScore,
        lastScore: lastQuiz.length > 0 ? {
          score: lastQuiz[0].score,
          total_questions: lastQuiz[0].total_questions,
          percentage: lastQuiz[0].percentage
        } : null
      },
      quizHistory: quizHistory
    });
  } catch (error) {
    console.error('❌ Math profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load math profile',
      details: error.message 
    });
  }
});


// ==================== MATH PROGRESS (TRACK PROGRESS PAGE) ====================
router.get('/math-progress', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    console.log('📊 Math progress request for userId:', userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    console.log('✅ Student found:', student.name);

    // ⭐ FILTER OUT placement quiz - only get regular quizzes
    const quizzes = await db.collection('quiz_attempts')
      .find({ 
        student_id: student._id,
        quiz_type: { $ne: 'placement' }  // ✅ EXCLUDE placement quiz
      })
      .sort({ created_at: -1 })
      .toArray();

    const totalQuizzes = quizzes.length;
    
    console.log('📝 Total quizzes found (excluding placement):', totalQuizzes);

    // Calculate average score
    const averageScore = totalQuizzes > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / totalQuizzes)
      : 0;

    console.log('📊 Average score:', averageScore + '%');

    // ⭐ CALCULATE total points from quiz attempts
    let totalPoints = 0;
    quizzes.forEach(quiz => {
      const points = (quiz.score || 0) * 10;
      totalPoints += points;
    });

    console.log('⭐ Total points calculated:', totalPoints);

    // ⭐ Calculate current streak
    const currentStreak = calculateStreak(quizzes);
    console.log('🔥 Current streak:', currentStreak + ' days');

    // Get recent quizzes (last 5)
    const recentQuizzes = quizzes.slice(0, 5).map(q => ({
      date: new Date(q.created_at).toLocaleDateString('en-SG'),
      profile: q.profile_level || student.current_profile || 1,
      score: q.score,
      total: q.total_questions || 15,
      percentage: q.percentage
    }));

    console.log('📤 Sending progress data');

    res.json({
      success: true,
      progressData: {
        currentProfile: student.current_profile || null,
        placementCompleted: student.placement_completed || false,
        profileProgress: student.current_profile ? ((student.current_profile) / 10) * 100 : 0,
        totalQuizzes: totalQuizzes,           // ✅ Now excludes placement
        averageScore: averageScore,           // ✅ Calculated correctly
        streak: currentStreak,                // ✅ Now calculated!
        currentStreak: currentStreak,         // ✅ Now calculated!
        totalPoints: totalPoints,             // ✅ Now calculated from quiz_attempts
        consecutiveFails: student.consecutive_fails || 0,
        profileHistory: [],
        recentQuizzes: recentQuizzes
      }
    });
  } catch (error) {
    console.error('❌ Math progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load progress',
      details: error.message 
    });
  }
});


// ==================== MATH SKILLS ====================
router.get('/math-skills', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const currentProfile = student.current_profile || 1;
    
    let skills = await db.collection('math_skills').findOne({ student_id: student._id });
    

    if (!skills) {
      skills = {
        student_id: student._id,
        addition: { current_level: 0, xp: 0, max_level: 5 },
        subtraction: { current_level: 0, xp: 0, max_level: 5 },
        multiplication: { current_level: 0, xp: 0, max_level: 5 },
        division: { current_level: 0, xp: 0, max_level: 5 },
        created_at: new Date()
      };
      await db.collection('math_skills').insertOne(skills);
    }

    // Level thresholds for calculating percentage within current level
    const levelThresholds = [0, 50, 100, 150, 200, 250];
    
    const calculatePercentage = (level, xp) => {
      if (level >= 5) return 100; // Max level
      const currentThreshold = levelThresholds[level];
      const nextThreshold = levelThresholds[level + 1];
      const xpInLevel = xp - currentThreshold;
      const xpNeeded = nextThreshold - currentThreshold;
      return Math.round((xpInLevel / xpNeeded) * 100);
    };

    const skillsArray = [
      { 
        skill_name: 'Addition', 
        current_level: skills.addition?.current_level || 0,
        xp: skills.addition?.xp || 0,
        max_level: 5, 
        unlocked: true,
        percentage: calculatePercentage(skills.addition?.current_level || 0, skills.addition?.xp || 0)
      },
      { 
        skill_name: 'Subtraction', 
        current_level: skills.subtraction?.current_level || 0,
        xp: skills.subtraction?.xp || 0,
        max_level: 5, 
        unlocked: true,
        percentage: calculatePercentage(skills.subtraction?.current_level || 0, skills.subtraction?.xp || 0)
      },
      { 
        skill_name: 'Multiplication', 
        current_level: skills.multiplication?.current_level || 0,
        xp: skills.multiplication?.xp || 0,
        max_level: 5, 
        unlocked: currentProfile >= 6,
        percentage: calculatePercentage(skills.multiplication?.current_level || 0, skills.multiplication?.xp || 0)
      },
      { 
        skill_name: 'Division', 
        current_level: skills.division?.current_level || 0,
        xp: skills.division?.xp || 0,
        max_level: 5, 
        unlocked: currentProfile >= 6,
        percentage: calculatePercentage(skills.division?.current_level || 0, skills.division?.xp || 0)
      }
    ];

    res.json({
      success: true,
      currentProfile,
      skills: skillsArray
    });
  } catch (error) {
    console.error('Math skills error:', error);
    res.status(500).json({ success: false, error: 'Failed to load skills' });
  }
});

// ==================== QUIZ RESULTS ====================
router.get('/quiz-results', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const quizzes = await db.collection('quiz_attempts')
      .find({ student_id: student._id })
      .sort({ created_at: -1 })
      .toArray();

    const results = quizzes.map(q => ({
      id: q._id.toString(),
      date: new Date(q.created_at).toLocaleDateString(),
      profile: q.profile_level || 1,
      score: q.score,
      maxScore: q.total_questions,
      questions: q.total_questions,
      percentage: q.percentage
    }));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Quiz results error:', error);
    res.status(500).json({ success: false, error: 'Failed to load results' });
  }
});

// ==================== QUIZ HISTORY ====================

// ==================== QUIZ HISTORY ====================
router.get('/quiz-history', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    console.log('📊 Quiz history request for userId:', userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    console.log('✅ Student found:', student.name);

    // ⭐ FILTER OUT placement quiz - only get regular quizzes
    const quizzes = await db.collection('quiz_attempts')
      .find({ 
        student_id: student._id,
        quiz_type: { $ne: 'placement' }  // ✅ EXCLUDE placement quiz
      })
      .sort({ created_at: -1 })
      .toArray();

    console.log('📝 Total quiz attempts found (excluding placement):', quizzes.length);

    const history = quizzes.map(q => {
      const date = new Date(q.created_at);
      return {
        id: q._id.toString(),
        date: date.toLocaleDateString('en-SG'),
        time: date.toLocaleTimeString('en-SG'),
        profile: q.profile_level || student.current_profile || 1,
        score: q.score,
        maxScore: q.total_questions || 15,
        totalQuestions: q.total_questions || 15,
        percentage: q.percentage
      };
    });

    // Calculate summary statistics (excluding placement)
    const totalAttempts = quizzes.length;
    const averageScore = totalAttempts > 0
      ? Math.round(quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / totalAttempts)
      : 0;
    const passedQuizzes = quizzes.filter(q => (q.percentage || 0) >= 70).length;
    const bestScore = totalAttempts > 0
      ? Math.max(...quizzes.map(q => q.percentage || 0))
      : 0;

    console.log('📤 Sending quiz history:', {
      totalAttempts,
      averageScore,
      passedQuizzes,
      bestScore
    });

    res.json({
      success: true,
      history,
      statistics: {
        totalAttempts,
        averageScore,
        passedQuizzes,
        bestScore
      }
    });
  } catch (error) {
    console.error('❌ Quiz history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load history',
      details: error.message 
    });
  }
});


// ==================== LEADERBOARD ====================
router.get('/leaderboard', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const students = await db.collection('students').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { points: -1 } },
      { $limit: 50 }
    ]).toArray();

    const leaderboard = students.map((s, index) => ({
      rank: index + 1,
      name: s.user.name || s.name,
      points: s.points || 0,
      level: s.level || 1,
      achievements: 0,
      isCurrentUser: s.user_id.equals(userId)
    }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load leaderboard' });
  }
});

// ==================== SUPPORT TICKETS ====================
router.post('/support-ticket', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const ticket = {
      student_id: student._id,
      user_id: userId,
      category: req.body.category,
      priority: req.body.priority,
      subject: req.body.subject,
      description: req.body.description,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.collection('support_tickets').insertOne(ticket);
    
    res.json({
      success: true,
      ticketId: `TICKET-${result.insertedId.toString().slice(-6).toUpperCase()}`,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

router.get('/support-tickets', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const tickets = await db.collection('support_tickets')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    const formattedTickets = tickets.map(t => ({
      id: `TICKET-${t._id.toString().slice(-6).toUpperCase()}`,
      category: t.category,
      priority: t.priority,
      subject: t.subject,
      status: t.status,
      createdOn: new Date(t.created_at).toLocaleDateString(),
      lastUpdate: new Date(t.updated_at).toLocaleDateString()
    }));

    res.json({
      success: true,
      tickets: formattedTickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to load tickets' });
  }
});

// ==================== TESTIMONIALS ====================
router.post('/testimonial', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    
    const student = await db.collection('students').findOne({ user_id: userId });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const testimonial = {
      student_id: student._id,
      user_id: userId,
      title: req.body.title,
      rating: req.body.rating,
      testimonial: req.body.testimonial,
      display_name: req.body.displayName,
      allow_public: req.body.allowPublic,
      created_at: new Date()
    };

    await db.collection('testimonials').insertOne(testimonial);
    
    res.json({
      success: true,
      message: 'Testimonial submitted successfully'
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ success: false, error: 'Failed to create testimonial' });
  }
});

module.exports = router;