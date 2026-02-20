// AttemptQuiz.js — Quiz Hub: Placement Quiz + Quiz Journey
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import studentService from "../../services/studentService";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

const TOPIC_META = {
  Addition:       { emoji: '➕', color: '#3b82f6', light: '#eff6ff', border: '#bfdbfe' },
  Subtraction:    { emoji: '➖', color: '#f59e0b', light: '#fffbeb', border: '#fde68a' },
  Multiplication: { emoji: '✖️', color: '#10b981', light: '#ecfdf5', border: '#a7f3d0' },
  Division:       { emoji: '➗', color: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe' },
};
const DEFAULT_TOPIC_META = { emoji: '📚', color: '#6b7280', light: '#f9fafb', border: '#e5e7eb' };
function getTopicMeta(topic) { return TOPIC_META[topic] || DEFAULT_TOPIC_META; }

export default function AttemptQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [placementCompleted, setPlacementCompleted] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [error, setError] = useState("");

  // Placement topics: { available: [], completed: [] }
  const [placementTopics, setPlacementTopics] = useState({ available: [], completed: [] });

  // Quiz Journey topics enriched with per-topic unlocked level
  // Each entry: { topic, levels, minLevel, maxLevel, unlockedLevel }
  const [quizJourneyTopics, setQuizJourneyTopics] = useState([]);

  const token = () => localStorage.getItem('token');

  useEffect(() => {
    loadAll();
    const handleFocus = () => loadAll();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [navigate]); // navigate is stable from react-router-dom

  const loadAll = async () => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    setLoading(true);
    try {
      // 1. Placement status + total points (from math profile)
      const [placementResult, profileResult, levelResult, placementTopicsResult, quizzesResult] = await Promise.all([
        studentService.getPlacementStatus(),
        studentService.getMathProfile(),
        fetch(`${API_BASE_URL}/api/adaptive-quiz/student/current-level`, {
          headers: { Authorization: `Bearer ${token()}` }
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/mongo/student/placement-quiz/topics`, {
          headers: { Authorization: `Bearer ${token()}` }
        }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/adaptive-quiz/quizzes`, {
          headers: { Authorization: `Bearer ${token()}` }
        }).then(r => r.json()),
      ]);

      // Placement done?
      const done = placementResult?.success && (placementResult?.placementCompleted || placementResult?.placement_completed);
      setPlacementCompleted(done);

      // Total points
      const mp = profileResult?.mathProfile;
      setTotalPoints(mp?.total_points || 0);

      // Per-topic unlocked levels
      const topicLevels = levelResult?.success ? (levelResult.topicLevels || {}) : {};

      // Placement topics
      if (placementTopicsResult?.success) {
        setPlacementTopics({
          available: placementTopicsResult.availableTopics || [],
          completed: placementTopicsResult.completedTopics || [],
        });
      }

      // Quiz journey topics — group by topic, attach unlocked level
      if (quizzesResult?.success) {
        const topicsMap = {};
        quizzesResult.data.forEach(quiz => {
          const topic = quiz.topic || '';
          if (!topic) return; // skip quizzes with no topic
          if (!topicsMap[topic]) {
            topicsMap[topic] = { topic, levels: [], minLevel: Infinity, maxLevel: -Infinity };
          }
          topicsMap[topic].levels.push(quiz.quiz_level);
          topicsMap[topic].minLevel = Math.min(topicsMap[topic].minLevel, quiz.quiz_level);
          topicsMap[topic].maxLevel = Math.max(topicsMap[topic].maxLevel, quiz.quiz_level);
        });

        // Attach the per-topic unlocked level from the profile, and only show
        // topics where the student has actually done a placement (unlockedLevel >= 1)
        const enriched = Object.values(topicsMap)
          .map(t => ({
            ...t,
            unlockedLevel: topicLevels[t.topic] || 0,
          }))
          .filter(t => t.unlockedLevel >= 1) // only show topics with at least 1 unlocked level
          .sort((a, b) => a.topic.localeCompare(b.topic));

        setQuizJourneyTopics(enriched);
      }
    } catch (e) {
      console.error("❌ Load error:", e);
      setError("Failed to load quiz data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlacement = (topic) => navigate(`/student/quiz/placement?topic=${encodeURIComponent(topic)}`);
  const handleStartJourneyTopic = (topic) => navigate(`/student/quiz-journey?topic=${encodeURIComponent(topic)}`);

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div style={S.loadingPage}>
        <div style={S.loadingBox}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎮</div>
          <div style={S.loadingText}>Loading your quiz hub…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* ── Top Hero bar ── */}
      <div style={S.hero}>
        <div style={S.heroLeft}>
          <h1 style={S.heroTitle}>📝 Math Quiz Hub</h1>
          <p style={S.heroSub}>Complete placement quizzes to unlock your personalised quiz journey!</p>
        </div>
        <div style={S.heroRight}>
          <div style={S.pointsPill}>
            <span style={{ fontSize: 22 }}>⭐</span>
            <span style={S.pointsNum}>{totalPoints.toLocaleString()}</span>
            <span style={S.pointsLabel}>pts</span>
          </div>
          <button style={S.backBtn} onClick={() => navigate('/student')}>← Dashboard</button>
        </div>
      </div>

      <div style={S.content}>
        {error && <div style={S.errorBanner}>⚠️ {error}</div>}

        {/* ══════════════ PLACEMENT QUIZ SECTION ══════════════ */}
        <section style={S.section}>
          <div style={S.sectionHeader}>
            <div style={S.sectionIconWrap('#3b82f6')}>🎯</div>
            <div>
              <h2 style={S.sectionTitle}>Placement Quizzes</h2>
              <p style={S.sectionSub}>Take a placement quiz to find your level for each topic</p>
            </div>
          </div>

          {placementTopics.available.length === 0 && placementTopics.completed.length === 0 ? (
            <div style={S.emptyCard}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <p style={S.emptyText}>No placement quizzes have been launched yet.<br />Please wait for your teacher.</p>
            </div>
          ) : (
            <>
              {placementTopics.available.length > 0 && (
                <div style={S.topicGrid}>
                  {placementTopics.available.map(topic => {
                    const meta = getTopicMeta(topic);
                    return (
                      <div
                        key={topic}
                        style={{ ...S.topicCard, borderColor: meta.border, background: meta.light }}
                        onClick={() => handleStartPlacement(topic)}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${meta.color}33`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = S.topicCard.boxShadow; }}
                      >
                        <div style={{ ...S.topicIconCircle, background: meta.color }}>
                          <span style={{ fontSize: 28 }}>{meta.emoji}</span>
                        </div>
                        <h3 style={S.topicName}>{topic}</h3>
                        <div style={S.topicBadge}>Quiz Level 1 · Adaptive</div>
                        <button
                          style={{ ...S.actionBtn, background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}cc 100%)` }}
                          onClick={e => { e.stopPropagation(); handleStartPlacement(topic); }}
                        >
                          🚀 Start Placement
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {placementTopics.completed.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={S.completedLabel}>✅ Completed Placements</p>
                  <div style={S.pillRow}>
                    {placementTopics.completed.map(topic => {
                      const meta = getTopicMeta(topic);
                      return (
                        <div key={topic} style={{ ...S.completedPill, borderColor: meta.border, background: meta.light }}>
                          <span style={{ marginRight: 6 }}>{meta.emoji}</span>{topic}
                          <span style={S.checkCircle}>✓</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ══════════════ QUIZ JOURNEY SECTION ══════════════ */}
        <section style={S.section}>
          <div style={S.sectionHeader}>
            <div style={S.sectionIconWrap('#8b5cf6')}>🚀</div>
            <div>
              <h2 style={S.sectionTitle}>Quiz Journey</h2>
              <p style={S.sectionSub}>Continue levelling up in topics you have unlocked</p>
            </div>
          </div>

          {!placementCompleted ? (
            <div style={S.lockedCard}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
              <p style={S.lockedText}>Complete at least one Placement Quiz to unlock the Quiz Journey!</p>
              {placementTopics.available.length > 0 && (
                <button
                  style={{ ...S.actionBtn, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', marginTop: 16, maxWidth: 240 }}
                  onClick={() => handleStartPlacement(placementTopics.available[0])}
                >
                  🎯 Start a Placement
                </button>
              )}
            </div>
          ) : quizJourneyTopics.length === 0 ? (
            <div style={S.emptyCard}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={S.emptyText}>
                No Quiz Journey topics available yet.<br />
                Complete your placement quizzes to unlock them!
              </p>
            </div>
          ) : (
            <div style={S.topicGrid}>
              {quizJourneyTopics.map(topicData => {
                const meta = getTopicMeta(topicData.topic);
                const progressPct = Math.round((topicData.unlockedLevel / topicData.maxLevel) * 100);
                return (
                  <div
                    key={topicData.topic}
                    style={{ ...S.topicCard, borderColor: meta.border, background: meta.light }}
                    onClick={() => handleStartJourneyTopic(topicData.topic)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${meta.color}33`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = S.topicCard.boxShadow; }}
                  >
                    <div style={{ ...S.topicIconCircle, background: meta.color }}>
                      <span style={{ fontSize: 28 }}>{meta.emoji}</span>
                    </div>
                    <h3 style={S.topicName}>{topicData.topic}</h3>

                    {/* Unlocked level badge */}
                    <div style={{ ...S.levelBadge, background: meta.color }}>
                      Level {topicData.unlockedLevel} unlocked
                    </div>

                    {/* Mini progress bar */}
                    <div style={S.progressBarTrack}>
                      <div style={{ ...S.progressBarFill, width: `${progressPct}%`, background: meta.color }} />
                    </div>
                    <p style={S.progressLabel}>
                      Levels 1–{topicData.maxLevel} available &nbsp;·&nbsp; {progressPct}% unlocked
                    </p>

                    <button
                      style={{ ...S.actionBtn, background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}cc 100%)` }}
                      onClick={e => { e.stopPropagation(); handleStartJourneyTopic(topicData.topic); }}
                    >
                      ▶ Continue Journey
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────── */
const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },

  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroLeft: {},
  heroTitle: { fontSize: 32, fontWeight: 800, color: 'white', margin: 0 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  heroRight: { display: 'flex', alignItems: 'center', gap: 16 },

  pointsPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: 40,
    border: '1px solid rgba(255,255,255,0.4)',
  },
  pointsNum: { fontSize: 22, fontWeight: 800, color: 'white' },
  pointsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 },

  backBtn: {
    padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white',
    border: '2px solid rgba(255,255,255,0.4)', borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
  },

  content: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 48px' },

  errorBanner: {
    padding: '12px 16px', background: '#fef2f2', color: '#991b1b',
    borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600,
  },

  section: {
    background: 'white', borderRadius: 20, padding: 32,
    marginBottom: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  sectionIconWrap: (color) => ({
    width: 52, height: 52, borderRadius: 14, background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, flexShrink: 0,
  }),
  sectionTitle: { fontSize: 22, fontWeight: 700, color: '#1f2937', margin: 0 },
  sectionSub: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },

  topicGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: 20,
  },
  topicCard: {
    borderRadius: 16, padding: '24px 18px 20px', border: '2px solid',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  topicIconCircle: {
    width: 60, height: 60, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  topicName: { fontSize: 18, fontWeight: 700, color: '#1f2937', margin: 0, textAlign: 'center' },
  topicBadge: {
    padding: '3px 10px', background: '#f3f4f6', color: '#6b7280',
    borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px',
  },

  levelBadge: {
    padding: '4px 12px', color: 'white', borderRadius: 20,
    fontSize: 12, fontWeight: 700,
  },
  progressBarTrack: {
    width: '100%', height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s' },
  progressLabel: { fontSize: 11, color: '#9ca3af', margin: 0, textAlign: 'center' },

  actionBtn: {
    width: '100%', padding: '11px 0', color: 'white', border: 'none',
    borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(0,0,0,0.15)', marginTop: 4,
  },

  emptyCard: {
    textAlign: 'center', padding: '40px 20px',
    background: '#f9fafb', borderRadius: 16, border: '2px dashed #e5e7eb',
  },
  emptyText: { fontSize: 15, color: '#6b7280', lineHeight: 1.6, margin: 0 },

  lockedCard: {
    textAlign: 'center', padding: '40px 20px',
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    borderRadius: 16, border: '2px dashed #d1d5db',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  lockedText: { fontSize: 16, color: '#4b5563', fontWeight: 600, margin: 0 },

  completedLabel: { fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  completedPill: {
    display: 'flex', alignItems: 'center', padding: '8px 16px',
    border: '2px solid', borderRadius: 40, fontSize: 14, fontWeight: 600, color: '#1f2937',
  },
  checkCircle: {
    marginLeft: 8, background: '#10b981', color: 'white',
    width: 20, height: 20, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700,
  },

  loadingPage: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  loadingBox: { textAlign: 'center' },
  loadingText: { fontSize: 22, color: 'white', fontWeight: 700 },
};
