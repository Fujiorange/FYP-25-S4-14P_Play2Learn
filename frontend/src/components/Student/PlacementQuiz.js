// PlacementQuiz.js - Topic-Based Placement Quiz (First Time) - WITH TOPIC SELECTION
// Redirects to the adaptive quiz (AttemptAdaptiveQuiz) after finding the Level 1 quiz for the topic.
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function PlacementQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [topics, setTopics] = useState({ availableTopics: [], completedTopics: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  const handleTopicSelect = useCallback(async (topic) => {
    setLoading(true);
    setError('');
    try {
      // Check if already completed for this topic
      const statusResult = await studentService.getPlacementStatus(topic);
      if (statusResult.success && statusResult.placementCompleted) {
        setError(`✅ You have already completed the placement quiz for ${topic}!`);
        setLoading(false);
        return;
      }

      // Find the launched adaptive Level-1 quiz for this topic
      const res = await fetch(
        `${API_BASE_URL}/api/mongo/student/placement-quiz/find-quiz?topic=${encodeURIComponent(topic)}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      if (data.success) {
        // Navigate to the adaptive quiz with placement flags so it shows the correct title
        navigate(`/student/adaptive-quiz/${data.quizId}?placement=true&topic=${encodeURIComponent(topic)}`);
      } else {
        setError(data.error || `No placement quiz available for ${topic}. Ask your teacher to launch one.`);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to start placement quiz. Please try again.');
      setLoading(false);
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
          // If no available topics, show a message
          if (!result.availableTopics || result.availableTopics.length === 0) {
            const msg = result.completedTopics?.length > 0
              ? '✅ You have completed all available placement quizzes!'
              : '⏳ No placement quizzes launched yet. Please ask your teacher.';
            setError(msg);
          } else {
            // Auto-select topic from URL if valid
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

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '900px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    subtitle: { fontSize: '15px', color: '#6b7280', marginTop: '8px' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
    infoMessage: { padding: '12px 16px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading topics...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎯 Placement Quiz — Select Topic</h1>
          <p style={styles.subtitle}>
            Choose a topic to start your placement quiz. Questions start at difficulty 1 and adapt based on your answers.
            Your result will unlock Quiz Journey levels for that topic.
          </p>
        </div>

        {error && (
          <div style={error.startsWith('✅') ? styles.infoMessage : styles.errorMessage}>
            {error}
          </div>
        )}

        {topics.availableTopics && topics.availableTopics.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Available Topics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {topics.availableTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  style={{
                    padding: '24px', background: 'white', border: '2px solid #3b82f6',
                    borderRadius: '12px', fontSize: '18px', fontWeight: '600',
                    color: '#1f2937', cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  📚 {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {topics.completedTopics && topics.completedTopics.length > 0 && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>✅ Completed Topics</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {topics.completedTopics.map((topic) => (
                <div key={topic} style={{ padding: '12px 20px', background: '#d1fae5', border: '2px solid #34d399', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                  ✓ {topic}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/student/quiz/attempt')}
          style={{ padding: '12px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'block', margin: '0 auto' }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
