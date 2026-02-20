// PlacementQuiz.js - Topic-Based Placement Quiz (First Time) - WITH TOPIC SELECTION
// Redirects to the adaptive quiz (AttemptAdaptiveQuiz) after finding the Level 1 quiz for the topic.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

const TOPIC_META = {
  Addition:       { emoji: '➕', color: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', desc: 'Start with simple addition and work your way up!' },
  Subtraction:    { emoji: '➖', color: '#f59e0b', light: '#fffbeb', border: '#fde68a', desc: 'Test your subtraction skills from the basics.' },
  Multiplication: { emoji: '✖️', color: '#10b981', light: '#ecfdf5', border: '#a7f3d0', desc: 'Sharpen your multiplication abilities.' },
  Division:       { emoji: '➗', color: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe', desc: 'Master division from the ground up.' },
};

const TOPIC_BADGE_LABEL = 'Quiz Level 1 · Adaptive';

const DEFAULT_TOPIC_META = { emoji: '📚', color: '#6b7280', light: '#f9fafb', border: '#e5e7eb', desc: 'Answer adaptive questions and unlock your level.' };

function getTopicMeta(topic) {
  return TOPIC_META[topic] || DEFAULT_TOPIC_META;
}

export default function PlacementQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [topics, setTopics] = useState({ availableTopics: [], completedTopics: [] });
  const [loading, setLoading] = useState(true);
  const [loadingTopic, setLoadingTopic] = useState(null);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  const handleTopicSelect = useCallback(async (topic) => {
    setLoadingTopic(topic);
    setError('');
    try {
      // Check if already completed for this topic
      const statusResult = await studentService.getPlacementStatus(topic);
      if (statusResult.success && statusResult.placementCompleted) {
        setError(`✅ You have already completed the placement quiz for ${topic}!`);
        setLoadingTopic(null);
        return;
      }

      // Find the launched adaptive Level-1 quiz for this topic
      const res = await fetch(
        `${API_BASE_URL}/api/mongo/student/placement-quiz/find-quiz?topic=${encodeURIComponent(topic)}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      if (data.success) {
        navigate(`/student/adaptive-quiz/${data.quizId}?placement=true&topic=${encodeURIComponent(topic)}`);
      } else {
        setError(data.error || `No placement quiz available for ${topic}. Ask your teacher to launch one.`);
        setLoadingTopic(null);
      }
    } catch (err) {
      setError('Failed to start placement quiz. Please try again.');
      setLoadingTopic(null);
    }
  }, [navigate]);

  useEffect(() => {
    const loadTopics = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const result = await studentService.getPlacementTopics();
        if (result.success) {
          setTopics(result);
          if (!result.availableTopics || result.availableTopics.length === 0) {
            const msg = result.completedTopics?.length > 0
              ? '✅ You have completed all available placement quizzes!'
              : '⏳ No placement quizzes launched yet. Please ask your teacher.';
            setError(msg);
          } else {
            const topicFromUrl = searchParams.get('topic');
            if (topicFromUrl && result.availableTopics.includes(topicFromUrl)) {
              handleTopicSelect(topicFromUrl);
              return;
            }
          }
        } else {
          setError(result.error || 'Failed to load topics');
        }
      } catch (err) {
        setError('Failed to load topics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadTopics();
  }, [navigate, searchParams, handleTopicSelect]);

  if (loading) {
    return (
      <div style={S.loadingContainer}>
        <div style={S.loadingSpinner}>⏳</div>
        <div style={S.loadingText}>Loading topics…</div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* ── Hero header ── */}
      <div style={S.hero}>
        <div style={S.heroIcon}>🎯</div>
        <h1 style={S.heroTitle}>Placement Quiz</h1>
        <p style={S.heroSub}>
          Pick a topic below. Questions start easy and get harder as you go —
          your score will unlock the right Quiz Journey levels for you!
        </p>
      </div>

      <div style={S.content}>
        {/* Error / info banner */}
        {error && (
          <div style={error.startsWith('✅') || error.startsWith('⏳') ? S.infoBanner : S.errorBanner}>
            {error}
          </div>
        )}

        {/* Available topic cards */}
        {topics.availableTopics && topics.availableTopics.length > 0 && (
          <>
            <h2 style={S.sectionTitle}>Choose a Topic to Begin</h2>
            <div style={S.cardGrid}>
              {topics.availableTopics.map((topic) => {
                const meta = getTopicMeta(topic);
                return (
                  <div
                    key={topic}
                    style={{
                      ...S.topicCard,
                      borderColor: meta.border,
                      background: meta.light,
                      opacity: loadingTopic && loadingTopic !== topic ? 0.6 : 1,
                    }}
                  >
                    <div style={{ ...S.topicIconWrap, background: meta.color }}>
                      <span style={S.topicIcon}>{meta.emoji}</span>
                    </div>
                    <h3 style={S.topicName}>{topic}</h3>
                    <p style={S.topicDesc}>{meta.desc}</p>
                    <div style={S.topicBadge}>{TOPIC_BADGE_LABEL}</div>
                    <button
                      style={{
                        ...S.startBtn,
                        background: loadingTopic === topic
                          ? '#9ca3af'
                          : `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}cc 100%)`,
                        cursor: loadingTopic === topic || loadingTopic ? 'not-allowed' : 'pointer',
                      }}
                      disabled={!!loadingTopic}
                      onClick={() => handleTopicSelect(topic)}
                    >
                      {loadingTopic === topic ? '⏳ Starting…' : '🚀 Start Placement'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Completed topics */}
        {topics.completedTopics && topics.completedTopics.length > 0 && (
          <>
            <h2 style={{ ...S.sectionTitle, marginTop: '32px' }}>✅ Completed Topics</h2>
            <div style={S.completedRow}>
              {topics.completedTopics.map((topic) => {
                const meta = getTopicMeta(topic);
                return (
                  <div key={topic} style={{ ...S.completedPill, borderColor: meta.border, background: meta.light }}>
                    <span style={{ marginRight: '6px' }}>{meta.emoji}</span>
                    {topic}
                    <span style={S.checkMark}>✓</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Back button */}
        <button style={S.backBtn} onClick={() => navigate('/student/quiz/attempt')}>
          ← Back to Quiz Hub
        </button>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  hero: {
    textAlign: 'center',
    padding: '48px 24px 32px',
    color: 'white',
  },
  heroIcon: { fontSize: '56px', marginBottom: '12px' },
  heroTitle: { fontSize: '36px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.5px' },
  heroSub: { fontSize: '16px', opacity: 0.9, maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 },

  content: { maxWidth: '960px', margin: '0 auto', padding: '0 24px 48px' },

  sectionTitle: {
    fontSize: '20px', fontWeight: '700', color: 'white',
    marginBottom: '20px', marginTop: '8px',
  },

  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },

  topicCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '28px 20px 24px',
    textAlign: 'center',
    border: '2px solid',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },

  topicIconWrap: {
    width: '64px', height: '64px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '4px',
  },
  topicIcon: { fontSize: '32px' },
  topicName: { fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 },
  topicDesc: { fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 },

  topicBadge: {
    padding: '4px 12px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  startBtn: {
    width: '100%',
    padding: '13px 0',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    transition: 'opacity 0.2s, transform 0.1s',
    marginTop: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },

  completedRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  completedPill: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 18px',
    border: '2px solid',
    borderRadius: '40px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    background: 'white',
  },
  checkMark: {
    marginLeft: '8px',
    background: '#10b981',
    color: 'white',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
  },

  infoBanner: {
    padding: '14px 20px', background: 'rgba(255,255,255,0.15)', color: 'white',
    borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600',
    backdropFilter: 'blur(4px)',
  },
  errorBanner: {
    padding: '14px 20px', background: '#fef2f2', color: '#991b1b',
    borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600',
    border: '1px solid #fecaca',
  },

  backBtn: {
    marginTop: '36px',
    display: 'block',
    padding: '12px 28px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.4)',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  loadingSpinner: { fontSize: '48px', marginBottom: '16px' },
  loadingText: { fontSize: '22px', color: 'white', fontWeight: '700' },
};
