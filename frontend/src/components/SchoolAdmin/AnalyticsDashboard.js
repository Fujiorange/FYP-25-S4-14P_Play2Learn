import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './SchoolAdmin.css';

// Mock analytics data - will be replaced with real API calls
const mockAnalytics = {
  overview: {
    totalStudents: 156,
    activeToday: 89,
    avgPointsPerStudent: 245,
    totalBadgesEarned: 423,
    quizzesCompletedThisWeek: 312,
    avgQuizScore: 78.5
  },
  classPerformance: [
    { class: 'P1-A', students: 32, avgScore: 85, avgPoints: 268, quizzesCompleted: 89, trend: 'up' },
    { class: 'P1-B', students: 30, avgScore: 72, avgPoints: 198, quizzesCompleted: 76, trend: 'down' },
    { class: 'P1-C', students: 28, avgScore: 68, avgPoints: 175, quizzesCompleted: 62, trend: 'down' },
    { class: 'P1-D', students: 33, avgScore: 81, avgPoints: 245, quizzesCompleted: 91, trend: 'up' },
    { class: 'P1-E', students: 33, avgScore: 77, avgPoints: 221, quizzesCompleted: 82, trend: 'stable' }
  ],
  topStudents: [
    { id: 1, name: 'Carol Wong', class: 'P1-A', points: 450, badges: 5, avgScore: 94 },
    { id: 2, name: 'Alice Tan', class: 'P1-D', points: 320, badges: 4, avgScore: 89 },
    { id: 3, name: 'Emma Chen', class: 'P1-A', points: 275, badges: 3, avgScore: 87 },
    { id: 4, name: 'Bob Lee', class: 'P1-E', points: 185, badges: 2, avgScore: 82 },
    { id: 5, name: 'David Lim', class: 'P1-D', points: 165, badges: 2, avgScore: 80 }
  ],
  strugglingStudents: [
    { id: 6, name: 'Tom Koh', class: 'P1-C', points: 45, avgScore: 52, lastActive: '5 days ago', issue: 'Low quiz scores' },
    { id: 7, name: 'Sarah Ng', class: 'P1-B', points: 38, avgScore: 48, lastActive: '7 days ago', issue: 'Inactive' },
    { id: 8, name: 'James Ong', class: 'P1-C', points: 52, avgScore: 55, lastActive: '3 days ago', issue: 'Low quiz scores' },
    { id: 9, name: 'Lily Teo', class: 'P1-B', points: 61, avgScore: 58, lastActive: '2 days ago', issue: 'Declining trend' }
  ],
  badgeDistribution: [
    { name: 'First Steps', earned: 142, icon: '🌟' },
    { name: 'Fast Learner', earned: 89, icon: '🚀' },
    { name: 'Streak Master', earned: 67, icon: '🔥' },
    { name: 'High Achiever', earned: 45, icon: '📈' },
    { name: 'Perfect Score', earned: 23, icon: '💯' },
    { name: 'Math Champion', earned: 8, icon: '👑' }
  ],
  weeklyTrend: [
    { week: 'Week 1', avgScore: 72, activeStudents: 134 },
    { week: 'Week 2', avgScore: 74, activeStudents: 141 },
    { week: 'Week 3', avgScore: 76, activeStudents: 138 },
    { week: 'Week 4', avgScore: 78, activeStudents: 145 }
  ]
};

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'school-admin') { navigate('/login'); return; }
    loadAnalytics();
  }, [navigate]);

  const loadAnalytics = async () => {
    try {
      // TODO: Replace with real API call
      // const result = await schoolAdminService.getAnalytics();
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading analytics...</div></div>;
  }

  const strugglingClasses = analytics.classPerformance.filter(c => c.avgScore < 75);
  const topClasses = analytics.classPerformance.filter(c => c.avgScore >= 80);

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-secondary" onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        </div>
      </header>

      <main className="sa-main-wide">
        <h1 className="sa-page-title">📊 Analytics & Performance</h1>
        <p className="sa-page-subtitle">Monitor class performance, identify struggling students, and track trends</p>

        {/* Tabs */}
        <div className="points-tabs">
          {['overview', 'classes', 'students', 'trends'].map(tab => (
            <button key={tab} className={`points-tab ${activeTab === tab ? 'points-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'overview' && '📈 Overview'}
              {tab === 'classes' && '🏫 Class Performance'}
              {tab === 'students' && '👥 Students'}
              {tab === 'trends' && '📅 Trends'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">👥</div>
                <p className="sa-stat-label">Total Students</p>
                <p className="sa-stat-value">{analytics.overview.totalStudents}</p>
              </div>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">✅</div>
                <p className="sa-stat-label">Active Today</p>
                <p className="sa-stat-value">{analytics.overview.activeToday}</p>
              </div>
              <div className="sa-stat-card">
                <div className="sa-stat-icon">📊</div>
                <p className="sa-stat-label">Avg Quiz Score</p>
                <p className="sa-stat-value">{analytics.overview.avgQuizScore}%</p>
              </div>
            </div>

            {/* Alert Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Struggling Classes Alert */}
              {strugglingClasses.length > 0 && (
                <div className="sa-card" style={{ borderLeft: '4px solid #dc2626' }}>
                  <h3 style={{ color: '#dc2626', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ Classes Needing Attention ({strugglingClasses.length})
                  </h3>
                  {strugglingClasses.map(cls => (
                    <div key={cls.class} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: '600' }}>{cls.class}</span>
                      <span style={{ color: '#dc2626' }}>Avg: {cls.avgScore}% {getTrendIcon(cls.trend)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Performing Classes */}
              {topClasses.length > 0 && (
                <div className="sa-card" style={{ borderLeft: '4px solid #16a34a' }}>
                  <h3 style={{ color: '#16a34a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🌟 Top Performing Classes ({topClasses.length})
                  </h3>
                  {topClasses.map(cls => (
                    <div key={cls.class} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: '600' }}>{cls.class}</span>
                      <span style={{ color: '#16a34a' }}>Avg: {cls.avgScore}% {getTrendIcon(cls.trend)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Badge Distribution */}
            <div className="sa-card">
              <h3 className="points-card-title">🏅 Badge Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.badgeDistribution.map((badge, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px', width: '32px' }}>{badge.icon}</span>
                    <span style={{ width: '120px', fontWeight: '500' }}>{badge.name}</span>
                    <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '8px', height: '24px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${(badge.earned / 142) * 100}%`, 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        height: '100%', 
                        borderRadius: '8px'
                      }}></div>
                    </div>
                    <span style={{ width: '50px', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>{badge.earned}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="sa-card">
            <h3 className="points-card-title">🏫 Class Performance Comparison</h3>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Students</th>
                  <th>Avg Score</th>
                  <th>Avg Points</th>
                  <th>Quizzes Done</th>
                  <th>Trend</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.classPerformance.sort((a, b) => b.avgScore - a.avgScore).map((cls, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600' }}>{cls.class}</td>
                    <td>{cls.students}</td>
                    <td>
                      <span style={{ color: getScoreColor(cls.avgScore), fontWeight: '600' }}>
                        {cls.avgScore}%
                      </span>
                    </td>
                    <td className="points-value">{cls.avgPoints}</td>
                    <td>{cls.quizzesCompleted}</td>
                    <td style={{ fontSize: '20px' }}>{getTrendIcon(cls.trend)}</td>
                    <td>
                      {cls.avgScore >= 80 ? (
                        <span className="sa-badge sa-badge-success">Excellent</span>
                      ) : cls.avgScore >= 70 ? (
                        <span className="sa-badge sa-badge-primary">Good</span>
                      ) : (
                        <span className="sa-badge sa-badge-danger">Needs Help</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            {/* Struggling Students Alert */}
            <div className="sa-card sa-mb-4" style={{ borderLeft: '4px solid #dc2626' }}>
              <h3 style={{ color: '#dc2626', margin: '0 0 16px 0' }}>⚠️ Students Needing Support</h3>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Avg Score</th>
                    <th>Points</th>
                    <th>Last Active</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.strugglingStudents.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: '600' }}>{student.name}</td>
                      <td><span className="sa-badge sa-badge-primary">{student.class}</span></td>
                      <td style={{ color: '#dc2626', fontWeight: '600' }}>{student.avgScore}%</td>
                      <td>{student.points}</td>
                      <td style={{ color: '#6b7280' }}>{student.lastActive}</td>
                      <td><span className="sa-badge sa-badge-danger">{student.issue}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Students */}
            <div className="sa-card">
              <h3 className="points-card-title">🏆 Top Performing Students</h3>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Avg Score</th>
                    <th>Points</th>
                    <th>Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td style={{ fontSize: '20px' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td style={{ fontWeight: '600' }}>{student.name}</td>
                      <td><span className="sa-badge sa-badge-primary">{student.class}</span></td>
                      <td style={{ color: '#16a34a', fontWeight: '600' }}>{student.avgScore}%</td>
                      <td className="points-value">{student.points}</td>
                      <td>{student.badges} 🏆</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="sa-card">
            <h3 className="points-card-title">📅 Weekly Performance Trend</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '250px', padding: '20px 0' }}>
              {analytics.weeklyTrend.map((week, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ 
                    height: `${week.avgScore * 2}px`, 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    width: '60px', 
                    margin: '0 auto',
                    borderRadius: '8px 8px 0 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: '8px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {week.avgScore}%
                  </div>
                  <p style={{ fontWeight: '600', marginTop: '12px', color: '#374151' }}>{week.week}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{week.activeStudents} active</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
              <span style={{ color: '#16a34a', fontWeight: '600' }}>📈 Overall Trend: +6% improvement over 4 weeks</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
