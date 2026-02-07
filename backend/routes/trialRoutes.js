/**
 * backend/routes/trialRoutes.js
 * Trial-mode API used by the TrialDashboard.
 *
 * In server.js it is mounted as:
 *   app.use('/api/trial', authenticateToken, trialRoutes);
 * So all routes here require a valid JWT.
 */

const express = require('express');
const router = express.Router();

const TrialClass = require('../models/TrialClass');
const TrialStudent = require('../models/TrialStudent');
const { ensureTrialSeedData } = require('../services/trialSeedService');
const TrialQuizAttempt = require('../models/TrialQuizAttempt');

// Optional: if your DB has a Question bank we can use it; otherwise we generate.
let QuestionModel;
try {
  QuestionModel = require('../models/Question');
} catch (e) {
  QuestionModel = null;
}

let QuizQuestionModel;
try {
  QuizQuestionModel = require('../models/QuizQuestion');
} catch (e) {
  QuizQuestionModel = null;
}

function getUserId(req) {
  return req.user?.userId || req.user?.id || req.user?._id || req.userId;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function calcNewProfile(currentProfile, score) {
  const cur = Number(currentProfile || 1);
  if (score >= 70) return clamp(cur + 1, 1, 5);
  if (score < 50) return clamp(cur - 1, 1, 5);
  return clamp(cur, 1, 5);
}

function bandFromScore(score) {
  return score >= 70 ? 'PASS' : 'FAIL';
}

function opKey(op) {
  const v = String(op || '').toLowerCase();
  if (v.includes('add')) return 'add';
  if (v.includes('sub')) return 'sub';
  if (v.includes('mul')) return 'mul';
  if (v.includes('div')) return 'div';
  return 'add';
}

// ---------------- quiz helpers ----------------
function opSymbol(op) {
  return op === 'add' ? '+' : op === 'sub' ? '-' : op === 'mul' ? '×' : '÷';
}

router.post('/bootstrap', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await ensureTrialSeedData(trialUserId);
    const classes = await TrialClass.find({ trial_user_id: trialUserId }).sort({ class_name: 1 }).lean();
    const students = await TrialStudent.find({ trial_user_id: trialUserId }).sort({ created_at: 1 }).lean();

    return res.json({ success: true, classes, students });
  } catch (err) {
    console.error('POST /api/trial/bootstrap error:', err);
    return res.status(500).json({ success: false, error: 'Failed to bootstrap trial data' });
  }
});

router.get('/classes', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await ensureTrialSeedData(trialUserId);

    const classes = await TrialClass.find({ trial_user_id: trialUserId }).sort({ class_name: 1 }).lean();
    return res.json({ success: true, classes });
  } catch (err) {
    console.error('GET /api/trial/classes error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load classes' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let studentsRaw = await TrialStudent.find({ trial_user_id: trialUserId }).sort({ created_at: 1 }).lean();

    if (!studentsRaw || studentsRaw.length === 0) {
      await ensureTrialSeedData(trialUserId);
      studentsRaw = await TrialStudent.find({ trial_user_id: trialUserId }).sort({ created_at: 1 }).lean();
    }

    // ✅ One-time only: attemptsLeft is 1 if no placement attempt exists, else 0
    const attemptedIds = await TrialQuizAttempt.distinct('student_id', {
      trial_user_id: trialUserId,
      type: 'placement',
    });
    const attemptedSet = new Set((attemptedIds || []).map((x) => String(x)));

    const playable = (studentsRaw || [])
      .filter((s) => !s.is_sample)
      .map((s) => ({
        ...s,
        profile: s.profile ?? 1,
        last_score: s.last_score ?? 0,
        attemptsLeft: attemptedSet.has(String(s._id)) ? 0 : 1,
      }));

    const samples = (studentsRaw || [])
      .filter((s) => !!s.is_sample)
      .map((s) => ({
        ...s,
        profile: s.profile ?? 1,
        last_score: s.last_score ?? 0,
      }));

    return res.json({ success: true, playable, samples, total: studentsRaw.length });
  } catch (err) {
    console.error('GET /api/trial/students error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load students' });
  }
});

// POST /api/trial/quiz/start
// body: { studentId, count? }
router.post('/quiz/start', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    const { studentId, count } = req.body || {};
    const n = Number(count || 15);

    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });

    await ensureTrialSeedData(trialUserId);

    const student = await TrialStudent.findOne({ _id: studentId, trial_user_id: trialUserId });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    // ✅ One-time only placement quiz per student (ever)
    const alreadyAttempted = await TrialQuizAttempt.exists({
      trial_user_id: trialUserId,
      student_id: studentId,
      type: 'placement',
    });

    if (alreadyAttempted) {
      return res.status(409).json({
        success: false,
        error: 'Placement quiz already completed for this student.',
      });
    }

    // Fetch questions from "quizquestions" if present
    let questions = [];
    if (QuizQuestionModel) {
      const docs = await QuizQuestionModel.aggregate([
        { $match: { is_active: { $ne: false } } },
        { $sample: { size: Math.max(1, Math.min(50, n)) } },
      ]);

      questions = (docs || [])
        .map((q) => {
          const prompt = q.prompt || q.text || q.questionText || q.question || '';
          const choices = Array.isArray(q.choices) ? q.choices : [];
          const correctIndex = Number(q.correctIndex ?? q.correct_index ?? 0);
          const operation = q.operation || q.topic || '';
          return {
            question_id: q._id,
            prompt,
            operation,
            choices,
            correctIndex,
            difficulty: q.difficulty ?? null,
            topic: q.topic ?? null,
            subject: q.subject ?? null,
          };
        })
        .filter((q) => q.prompt && q.choices.length >= 2);
    }

    // Fallback generated questions
    if (!questions.length) {
      const ops = ['add', 'sub', 'mul', 'div'];
      const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

      const makeQ = (op) => {
        let a = randInt(1, 20);
        let b = randInt(1, 20);
        let ans = a + b;
        let symbol = '+';

        if (op === 'sub') {
          if (b > a) [a, b] = [b, a];
          ans = a - b;
          symbol = '-';
        }
        if (op === 'mul') {
          ans = a * b;
          symbol = '×';
        }
        if (op === 'div') {
          b = randInt(1, 10);
          const q = randInt(1, 10);
          a = b * q;
          ans = q;
          symbol = '÷';
        }

        const correct = String(ans);
        const set = new Set([correct]);
        while (set.size < 4) set.add(String(ans + randInt(-5, 5)));
        const choices = Array.from(set);

        for (let i = choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }

        return {
          question_id: null,
          prompt: `${a} ${symbol} ${b} = ?`,
          operation: op,
          choices,
          correctIndex: choices.indexOf(correct),
          difficulty: 1,
          topic: 'Placement',
          subject: 'Math',
        };
      };

      questions = Array.from({ length: n }, (_, i) => makeQ(ops[i % ops.length]));
    }

    const attempt = await TrialQuizAttempt.create({
      trial_user_id: trialUserId,
      student_id: studentId,
      type: 'placement',
      total_questions: questions.length,
      correct_count: 0,
      score: 0,
      result_band: '',
      new_profile: student.profile || 1,
      questions: questions.map((q) => ({
        question_id: q.question_id,
        prompt: q.prompt,
        operation: q.operation,
        choices: q.choices,
        correctIndex: q.correctIndex,
        selectedIndex: null,
        isCorrect: false,
        difficulty: q.difficulty ?? null,
        topic: q.topic ?? null,
        subject: q.subject ?? null,
      })),
    });

    const safeQuestions = attempt.questions.map((q) => ({
      prompt: q.prompt,
      operation: q.operation,
      choices: q.choices,
    }));

    return res.json({ success: true, attemptId: attempt._id, questions: safeQuestions, total: safeQuestions.length });
  } catch (err) {
    console.error('POST /api/trial/quiz/start error:', err);
    return res.status(500).json({ success: false, error: 'Failed to start quiz' });
  }
});

// POST /api/trial/quiz/submit
router.post('/quiz/submit', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    const { attemptId, studentId, answers } = req.body || {};

    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!attemptId || !studentId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'attemptId, studentId and answers[] are required' });
    }

    const attempt = await TrialQuizAttempt.findOne({ _id: attemptId, trial_user_id: trialUserId, student_id: studentId });
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });

    const student = await TrialStudent.findOne({ _id: studentId, trial_user_id: trialUserId });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const qs = attempt.questions || [];

    for (let i = 0; i < qs.length; i++) {
      const raw = answers[i];
      const hasAnswer = raw !== null && raw !== undefined && raw !== '' && raw !== -1;

      const selected = hasAnswer ? Number(raw) : null;
      const correct = Number(qs[i].correctIndex);

      const selectedIndex = Number.isFinite(selected) ? selected : null;
      qs[i].selectedIndex = selectedIndex;
      qs[i].isCorrect = Number.isFinite(selectedIndex) && selectedIndex === correct;
    }

    const total = qs.length;
    const correctCount = qs.filter((q) => q.isCorrect).length;
    const score = total ? Math.round((correctCount / total) * 100) : 0;

    const breakdown = { add: 0, sub: 0, mul: 0, div: 0 };
    for (const q of qs) {
      const k = opKey(q.operation);
      if (q.isCorrect) breakdown[k] += 1;
    }

    const newProfile = calcNewProfile(student.profile || 1, score);

    attempt.correct_count = correctCount;
    attempt.score = score;
    attempt.result_band = bandFromScore(score);
    attempt.new_profile = newProfile;
    attempt.questions = qs;
    await attempt.save();

    student.last_score = score;
    student.last_operation_breakdown = breakdown;
    student.profile = newProfile;

    // ✅ Assign weakest operation as adaptive topic
    const weakest = Object.entries(breakdown).sort((a, b) => a[1] - b[1])[0]?.[0] || 'add';
    student.assigned_adaptive_topics = [weakest];

    await student.save();

    return res.json({
      success: true,
      score,
      correct: correctCount,
      total,
      result_band: attempt.result_band,
      new_profile: newProfile,
      operation_breakdown: breakdown,
      questions: qs.map((q) => ({
        prompt: q.prompt,
        operation: q.operation,
        choices: q.choices,
        selectedIndex: q.selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect: q.isCorrect,
      })),
    });
  } catch (err) {
    console.error('POST /api/trial/quiz/submit error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit quiz' });
  }
});

// GET /api/trial/teacher/overview
router.get('/teacher/overview', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const classId = String(req.query.classId || '');
    await ensureTrialSeedData(trialUserId);

    const filter = { trial_user_id: trialUserId };
    if (classId) filter.class_id = classId;

    const studentsRaw = await TrialStudent.find(filter).sort({ created_at: 1 }).lean();
    const students = (studentsRaw || []).map((s) => ({
      ...s,
      profile: s.profile ?? 1,
      last_score: s.last_score ?? 0,
      last_operation_breakdown: s.last_operation_breakdown || { add: 0, sub: 0, mul: 0, div: 0 },
      assigned_adaptive_topics: s.assigned_adaptive_topics || [],
    }));

    const ranked = [...students].sort((a, b) => Number(b.last_score || 0) - Number(a.last_score || 0));

    return res.json({
      success: true,
      classId,
      students,
      leaderboard: ranked.map((s) => ({
        student_id: s._id,
        name: s.name,
        score: s.last_score ?? 0,
        profile: s.profile ?? 1,
      })),
    });
  } catch (err) {
    console.error('GET /api/trial/teacher/overview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load overview' });
  }
});

// GET /api/trial/teacher/student/:studentId
router.get('/teacher/student/:studentId', async (req, res) => {
  try {
    const trialUserId = getUserId(req);
    const { studentId } = req.params;
    if (!trialUserId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });

    const student = await TrialStudent.findOne({ _id: studentId, trial_user_id: trialUserId }).lean();
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    // ✅ Teacher view should NEVER be blocked by attempt rules
    const attempts = await TrialQuizAttempt.find({ trial_user_id: trialUserId, student_id: studentId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      student: {
        ...student,
        profile: student.profile ?? 1,
        last_score: student.last_score ?? 0,
        last_operation_breakdown: student.last_operation_breakdown || { add: 0, sub: 0, mul: 0, div: 0 },
        assigned_adaptive_topics: student.assigned_adaptive_topics || [],
      },
      attempts: attempts.map((a) => ({
        _id: a._id,
        score: a.score ?? 0,
        correct: a.correct_count ?? 0,
        total: a.total_questions ?? 0,
        createdAt: a.createdAt || a.created_at,
      })),
    });
  } catch (err) {
    console.error('GET /api/trial/teacher/student/:studentId error:', err);
    return res.status(500).json({ success: false, error: 'Failed to load student details' });
  }
});

module.exports = router;
