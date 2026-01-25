// frontend/src/pages/Parent/ViewChildPerformance.js - COMPLETE VERSION
// ✅ Loads real performance data from database
// ✅ No more mock data

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

export default function ViewChildPerformance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [error, setError] = useState(null);
  const childInfo = location.state?.child;

  useEffect(() => {
    const loadPerformance = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      if (!childInfo?.studentId) {
        setError('No child selected');
        setLoading(false);
        return;
      }

      try {
        // ✅ FIXED: Load real performance data from database
        const result = await parentService.getChildPerformance(childInfo.studentId);
        
        if (result.success) {
          setPerformanceData(result.performance);
          setError(null);
        } else {
          console.error('Failed to load performance:', result.error);
          setError(result.error || 'Failed to load performance data');
        }
      } catch (error) {
        console.error('Error loading performance:', error);
        setError('Failed to load performance data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [navigate, childInfo]);

  const getGradeColor = (grade) => {
    const colors = {
      'A': '#10b981',
      'B': '#3b82f6',
      'C': '#f59e0b',
      'D': '#ef4444',
      'F': '#991b1b',
      'N/A': '#6b7280'
    };
    return colors[grade] || colors['N/A'];
  };

  const getProgressEmoji = (progress) => {
    const emojis = {
      'improving': '📈',
      'stable': '➡️',
      'declining': '📉'
    };
    return emojis[progress] || '➡️';
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    subtitle: { fontSize: '16px', color: '#6b7280', marginTop: '4px' },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    overallCard: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    overallScore: { fontSize: '64px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' },
    overallGrade: { fontSize: '24px', fontWeight: '600', marginBottom: '16px' },
    subjectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' },
    subjectCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    subjectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    subjectName: { fontSize: '18px', fontWeight: '600', color: '#1f2937' },
    subjectGrade: { fontSize: '24px', fontWeight: '700' },
    statRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' },
    statLabel: { fontSize: '14px', color: '#6b7280' },
    statValue: { fontSize: '14px', fontWeight: '600', color: '#1f2937' },
    strengthsList: { marginTop: '16px' },
    strengthsTitle: { fontSize: '14px', fontWeight: '600', color: '#10b981', marginBottom: '8px' },
    weaknessesTitle: { fontSize: '14px', fontWeight: '600', color: '#ef4444', marginBottom: '8px' },
    listItem: { fontSize: '13px', color: '#6b7280', marginBottom: '4px', paddingLeft: '16px' },
    recentQuizzesCard: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    sectionTitle: { fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#6b7280' },
    errorMessage: { background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #f87171' },
    infoBox: { background: '#dbeafe', border: '1px solid #60a5fa', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#1e40af' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.errorMessage}>
            <strong>⚠️ Error:</strong> {error}
            <button style={{...styles.backButton, marginLeft: '16px'}} onClick={() => navigate('/parent/children')}>
              ← Back to Children
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📊 Performance Report</h1>
            <p style={styles.subtitle}>{childInfo?.name || 'Student'}</p>
          </div>
          <button style={styles.backButton} onClick={() => navigate('/parent/children')}>← Back to Children</button>
        </div>

        {performanceData?.message && (
          <div style={styles.infoBox}>
            <strong>ℹ️ Note:</strong> {performanceData.message}
          </div>
        )}

        <div style={styles.overallCard}>
          <div style={styles.overallScore}>{performanceData?.overallScore || 0}%</div>
          <div style={{...styles.overallGrade, color: getGradeColor(performanceData?.overallGrade)}}>
            Overall Grade: {performanceData?.overallGrade || 'N/A'}
          </div>
        </div>

        {performanceData?.subjects && performanceData.subjects.length > 0 ? (
          <div style={styles.subjectsGrid}>
            {performanceData.subjects.map((subject, index) => (
              <div key={index} style={styles.subjectCard}>
                <div style={styles.subjectHeader}>
                  <span style={styles.subjectName}>{subject.name}</span>
                  <span style={{...styles.subjectGrade, color: getGradeColor(subject.grade)}}>
                    {subject.grade}
                  </span>
                </div>

                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Score</span>
                  <span style={styles.statValue}>{subject.score}%</span>
                </div>

                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Progress</span>
                  <span style={styles.statValue}>
                    {getProgressEmoji(subject.progress)} {subject.progress}
                  </span>
                </div>

                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Quizzes Completed</span>
                  <span style={styles.statValue}>{subject.quizzesCompleted}</span>
                </div>

                <div style={styles.statRow}>
                  <span style={styles.statLabel}>Avg. Time</span>
                  <span style={styles.statValue}>{subject.averageTime}</span>
                </div>

                {subject.strengths && subject.strengths.length > 0 && (
                  <div style={styles.strengthsList}>
                    <div style={styles.strengthsTitle}>✅ Strengths:</div>
                    {subject.strengths.map((strength, i) => (
                      <div key={i} style={styles.listItem}>• {strength}</div>
                    ))}
                  </div>
                )}

                {subject.weaknesses && subject.weaknesses.length > 0 && (
                  <div style={styles.strengthsList}>
                    <div style={styles.weaknessesTitle}>⚠️ Needs Improvement:</div>
                    {subject.weaknesses.map((weakness, i) => (
                      <div key={i} style={styles.listItem}>• {weakness}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>No performance data available</p>
            <p>Performance data will appear once {childInfo?.name || 'student'} completes quizzes</p>
          </div>
        )}

        {performanceData?.recentQuizzes && performanceData.recentQuizzes.length > 0 && (
          <div style={styles.recentQuizzesCard}>
            <h2 style={styles.sectionTitle}>Recent Quizzes</h2>
            {performanceData.recentQuizzes.map((quiz, index) => (
              <div key={index} style={styles.statRow}>
                <span style={styles.statLabel}>{quiz.subject} - {quiz.topic}</span>
                <span style={styles.statValue}>{quiz.score}% ({quiz.date})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}