// AttemptQuiz.js - FINAL VERSION with Real Navigation
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function AttemptQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [requiresPlacement, setRequiresPlacement] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuizData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        console.log('📡 Fetching math profile...');
        const result = await studentService.getMathProfile();
        console.log('📥 Profile result:', result);

        if (result.success) {
          if (result.requiresPlacement) {
            setRequiresPlacement(true);
            setProfileData(null);
          } else {
            setProfileData(result.profile);
            setRequiresPlacement(false);
          }
        } else {
          setError('Failed to load quiz data');
        }
      } catch (error) {
        console.error('❌ Load quiz data error:', error);
        setError('Failed to load quiz data');
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [navigate]);

  const formatOperations = (operations) => {
    if (!operations || !Array.isArray(operations)) return '';
    
    const opSymbols = {
      'addition': '➕ Addition',
      'subtraction': '➖ Subtraction',
      'multiplication': '✖️ Multiplication',
      'division': '➗ Division'
    };
    
    return operations.map(op => opSymbols[op] || op).join(', ');
  };

  const canTakeQuiz = profileData && profileData.attemptsRemaining > 0;

  const handleStartQuiz = () => {
    if (!canTakeQuiz) {
      alert('You have used all 2 attempts for today. Come back tomorrow at 12:00 AM SGT!');
      return;
    }
    // ✅ Navigate to actual quiz page
    navigate('/student/quiz/take');
  };

  const handleStartPlacement = () => {
    // ✅ Navigate to placement quiz page
    navigate('/student/quiz/placement');
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', width: '100%' },
    
    placementCard: { background: 'white', borderRadius: '16px', padding: '48px 32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    placementIcon: { fontSize: '64px', marginBottom: '24px' },
    placementTitle: { fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    placementText: { fontSize: '16px', color: '#6b7280', lineHeight: '1.6', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' },
    placementButton: { padding: '16px 48px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' },
    
    profileCard: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    profileBadge: { display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', borderRadius: '12px', fontSize: '24px', fontWeight: '700', marginBottom: '24px' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    infoBox: { padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb' },
    infoLabel: { fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' },
    infoValue: { fontSize: '20px', color: '#1f2937', fontWeight: '700' },
    attemptsBox: { padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '2px solid' },
    attemptsText: { fontSize: '18px', fontWeight: '600', textAlign: 'center' },
    
    quizCard: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    quizTitle: { fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' },
    quizDetails: { fontSize: '16px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' },
    startButton: { padding: '16px 48px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' },
    disabledButton: { cursor: 'not-allowed', opacity: 0.5 },
    lastScoreBox: { marginTop: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '2px solid #3b82f6' },
    lastScoreText: { fontSize: '16px', color: '#1e40af', fontWeight: '600' },
    
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading quiz data...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📝 Primary 1 Math Quiz</h1>
          <button 
            style={styles.backButton} 
            onClick={() => navigate('/student')}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            ← Back to Dashboard
          </button>
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* PLACEMENT REQUIRED */}
        {requiresPlacement && (
          <div style={styles.placementCard}>
            <div style={styles.placementIcon}>🎯</div>
            <h2 style={styles.placementTitle}>Complete Your Placement Quiz First!</h2>
            <p style={styles.placementText}>
              Welcome to Play2Learn! Before you can start taking regular quizzes, you need to complete a placement quiz. 
              This 15-question assessment will help us understand your current math level and place you in the right profile (1-10).
            </p>
            <button
              style={styles.placementButton}
              onClick={handleStartPlacement}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚀 Start Placement Quiz
            </button>
          </div>
        )}

        {/* REGULAR QUIZ (After Placement) */}
        {!requiresPlacement && profileData && (
          <>
            <div style={styles.profileCard}>
              <div style={styles.profileBadge}>
                🎯 {profileData.profile_name || `Profile ${profileData.current_profile}`}
              </div>
              
              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Number Range</div>
                  <div style={styles.infoValue}>
                    🔢 {profileData.number_range_min}-{profileData.number_range_max}
                  </div>
                </div>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Operations</div>
                  <div style={styles.infoValue}>
                    {formatOperations(profileData.operations)}
                  </div>
                </div>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Questions</div>
                  <div style={styles.infoValue}>📋 15 Questions</div>
                </div>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Pass Score</div>
                  <div style={styles.infoValue}>✅ {profileData.pass_threshold}%</div>
                </div>
              </div>

              <div style={{
                ...styles.attemptsBox,
                background: profileData.attemptsRemaining === 0 ? '#fee2e2' : '#d1fae5',
                borderColor: profileData.attemptsRemaining === 0 ? '#f87171' : '#34d399'
              }}>
                <div style={{
                  ...styles.attemptsText,
                  color: profileData.attemptsRemaining === 0 ? '#991b1b' : '#065f46'
                }}>
                  {profileData.attemptsRemaining === 2 && '🎮 2 quiz attempts available today!'}
                  {profileData.attemptsRemaining === 1 && '🎮 1 quiz attempt remaining today!'}
                  {profileData.attemptsRemaining === 0 && '⏰ No attempts left today. Come back tomorrow at 12:00 AM SGT!'}
                </div>
              </div>

              {profileData.lastScore && (
                <div style={styles.lastScoreBox}>
                  <div style={styles.lastScoreText}>
                    📊 Last Quiz Score: {profileData.lastScore.score}/{profileData.lastScore.total_questions} ({Math.round(profileData.lastScore.percentage)}%)
                    {profileData.lastScore.percentage >= profileData.pass_threshold ? ' - Great job! 🎉' : ' - Keep practicing! 💪'}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.quizCard}>
              <div style={styles.quizTitle}>🚀 Ready to Take the Quiz?</div>
              <div style={styles.quizDetails}>
                • 15 random math questions<br/>
                • Numbers between {profileData.number_range_min}-{profileData.number_range_max}<br/>
                • {formatOperations(profileData.operations)}<br/>
                • Score {profileData.pass_threshold}% or higher to advance to next profile!<br/>
                • Score below {profileData.fail_threshold}% six times to move down<br/>
              </div>
              <button
                style={{
                  ...styles.startButton,
                  ...(canTakeQuiz ? {} : styles.disabledButton)
                }}
                onClick={handleStartQuiz}
                disabled={!canTakeQuiz}
                onMouseEnter={(e) => canTakeQuiz && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => canTakeQuiz && (e.target.style.transform = 'translateY(0)')}
              >
                {canTakeQuiz ? '🎯 Start Quiz Now!' : '🔒 No Attempts Left'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}