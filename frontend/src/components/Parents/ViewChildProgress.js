// frontend/src/pages/Parent/ViewChildProgress.js - COMPLETE VERSION
// ✅ Loads real progress data from database
// ✅ No more mock data

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

export default function ViewChildProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const childInfo = location.state?.child;

  useEffect(() => {
    const loadProgress = async () => {
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
        // ✅ FIXED: Load real progress data from database
        const result = await parentService.getChildProgress(childInfo.studentId);
        
        if (result.success) {
          setProgressData(result.progress);
          setError(null);
        } else {
          console.error('Failed to load progress:', result.error);
          setError(result.error || 'Failed to load progress data');
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        setError('Failed to load progress data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate, childInfo]);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    subtitle: { fontSize: '16px', color: '#6b7280', marginTop: '4px' },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
    statCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', textAlign: 'center' },
    statValue: { fontSize: '36px', fontWeight: '700', color: '#10b981', marginBottom: '8px' },
    statLabel: { fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' },
    subjectsCard: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    sectionTitle: { fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' },
    subjectsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    subjectItem: { padding: '16px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #10b981' },
    subjectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    subjectName: { fontSize: '16px', fontWeight: '600', color: '#1f2937' },
    subjectLevel: { fontSize: '14px', color: '#10b981', fontWeight: '600' },
    progressBar: { width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', transition: 'width 0.3s' },
    progressText: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
    achievementsCard: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    achievementsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' },
    achievementBadge: { textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '2px solid #e5e7eb' },
    badgeIcon: { fontSize: '48px', marginBottom: '8px' },
    badgeName: { fontSize: '14px', fontWeight: '600', color: '#1f2937' },
    activitiesCard: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    activityItem: { padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    activityText: { fontSize: '14px', color: '#374151' },
    activityTime: { fontSize: '12px', color: '#6b7280' },
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
            <h1 style={styles.title}>📈 Learning Progress</h1>
            <p style={styles.subtitle}>{childInfo?.name || 'Student'}</p>
          </div>
          <button style={styles.backButton} onClick={() => navigate('/parent/children')}>← Back to Children</button>
        </div>

        {progressData?.message && (
          <div style={styles.infoBox}>
            <strong>ℹ️ Note:</strong> {progressData.message}
          </div>
        )}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{progressData?.overallProgress || 0}%</div>
            <div style={styles.statLabel}>Overall Progress</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>Lvl {progressData?.currentLevel || 1}</div>
            <div style={styles.statLabel}>Current Level</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{progressData?.totalPoints || 0}</div>
            <div style={styles.statLabel}>Total Points</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{progressData?.streak || 0} 🔥</div>
            <div style={styles.statLabel}>Day Streak</div>
          </div>
        </div>

        {progressData?.subjects && progressData.subjects.length > 0 ? (
          <div style={styles.subjectsCard}>
            <h2 style={styles.sectionTitle}>Subject Progress</h2>
            <div style={styles.subjectsList}>
              {progressData.subjects.map((subject, index) => (
                <div key={index} style={styles.subjectItem}>
                  <div style={styles.subjectHeader}>
                    <span style={styles.subjectName}>{subject.name}</span>
                    <span style={styles.subjectLevel}>Level {subject.currentLevel}</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${subject.progress}%`}} />
                  </div>
                  <div style={styles.progressText}>
                    {subject.completedTopics}/{subject.totalTopics} topics completed • {subject.points} points
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.subjectsCard}>
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>No subject progress yet</p>
              <p>Progress will be tracked once {childInfo?.name || 'student'} starts completing quizzes</p>
            </div>
          </div>
        )}

        {progressData?.achievements && progressData.achievements.length > 0 ? (
          <div style={styles.achievementsCard}>
            <h2 style={styles.sectionTitle}>🏆 Achievements</h2>
            <div style={styles.achievementsGrid}>
              {progressData.achievements.map((achievement, index) => (
                <div key={index} style={styles.achievementBadge}>
                  <div style={styles.badgeIcon}>{achievement.icon || '🏆'}</div>
                  <div style={styles.badgeName}>{achievement.name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.achievementsCard}>
            <h2 style={styles.sectionTitle}>🏆 Achievements</h2>
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>No achievements unlocked yet</p>
              <p>Keep completing quizzes to earn badges and achievements!</p>
            </div>
          </div>
        )}

        {progressData?.recentActivities && progressData.recentActivities.length > 0 ? (
          <div style={styles.activitiesCard}>
            <h2 style={styles.sectionTitle}>Recent Activities</h2>
            {progressData.recentActivities.map((activity, index) => (
              <div key={index} style={styles.activityItem}>
                <span style={styles.activityText}>{activity.description}</span>
                <span style={styles.activityTime}>{parentService.formatDate(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.activitiesCard}>
            <h2 style={styles.sectionTitle}>Recent Activities</h2>
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
              <p style={{ fontSize: '18px', fontWeight: '600' }}>No recent activities</p>
              <p>Activities will appear here as {childInfo?.name || 'student'} uses the platform</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}