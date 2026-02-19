// ViewLeaderboard.js - Level-First Ranking System
// Ranks by: 1) Level (highest first), 2) Points (if same level), 3) First quiz date
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function ViewLeaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserLevel, setCurrentUserLevel] = useState(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('class');
  const [leaderboardType, setLeaderboardType] = useState('overall'); // 'overall', 'combined', 'by-topic'
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicProfiles, setTopicProfiles] = useState([]);

  const getToken = () => localStorage.getItem('token');

  const loadLeaderboard = async (mode) => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const user = authService.getCurrentUser();
    setCurrentUser(user);

    try {
      setLoading(true);
      
      // ✅ STEP 1: Check placement status FIRST
      let isPlacementCompleted = false;
      try {
        const placementResponse = await fetch(`${API_BASE_URL}/api/mongo/student/placement-quiz/status`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const placementData = await placementResponse.json();
        
        if (placementData.success) {
          isPlacementCompleted = placementData.placementCompleted || false;
          console.log('✅ Placement completed:', isPlacementCompleted);
        }
      } catch (placementError) {
        console.warn('⚠️ Could not fetch placement status:', placementError);
      }
      
      // ✅ STEP 2: Fetch level only if placement completed
      if (isPlacementCompleted) {
        try {
          const levelResponse = await fetch(`${API_BASE_URL}/api/adaptive-quiz/student/current-level`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          });
          const levelData = await levelResponse.json();
          
          if (levelData.success) {
            setCurrentUserLevel(levelData.currentLevel || 1);
            console.log('✅ Your Quiz Journey level:', levelData.currentLevel);
          }
        } catch (levelError) {
          console.warn('⚠️ Could not fetch quiz journey level:', levelError);
        }
      } else {
        setCurrentUserLevel(null);
        console.log('⚠️ Placement not completed, level will show as "-"');
      }
      
      // ✅ STEP 3: Get leaderboard (class or school-wide)
      const result = mode === 'school' 
        ? await studentService.getLeaderboard(user.schoolId, null)
        : await studentService.getLeaderboard(user.schoolId, user.class);

      if (result.success) {
        setLeaderboard(result.leaderboard || []);
        console.log('✅ Leaderboard loaded:', result.leaderboard.length, 'students (Level-First Ranking)');
        
        // ✅ Debug: Check if current user is in the list
        const currentUserEntry = result.leaderboard.find(p => p.isCurrentUser);
        console.log('✅ Current user in leaderboard:', currentUserEntry ? 'YES' : 'NO');
        if (currentUserEntry) {
          console.log('✅ Current user data:', {
            rank: currentUserEntry.rank,
            level: currentUserEntry.level,
            points: currentUserEntry.points
          });
        }
      } else {
        setError('Failed to load leaderboard');
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Load leaderboard error:', error);
      setError('Failed to load leaderboard');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/student/leaderboard/topics`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setAvailableTopics(data.topics || []);
        if (data.topics && data.topics.length > 0 && !selectedTopic) {
          setSelectedTopic(data.topics[0]);
        }
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadTopicLeaderboard = async (topic) => {
    if (!topic) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/mongo/student/leaderboard/by-topic?topic=${encodeURIComponent(topic)}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      } else {
        setError(data.error || 'Failed to load topic leaderboard');
      }
    } catch (error) {
      console.error('Error loading topic leaderboard:', error);
      setError('Failed to load topic leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const loadCombinedLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mongo/student/leaderboard/combined`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      } else {
        setError(data.error || 'Failed to load combined leaderboard');
      }
    } catch (error) {
      console.error('Error loading combined leaderboard:', error);
      setError('Failed to load combined leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const loadMyTopicProfiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/student/my-topic-profiles`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setTopicProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Error loading topic profiles:', error);
    }
  };

  useEffect(() => {
    if (leaderboardType === 'overall') {
      loadLeaderboard(viewMode);
    } else if (leaderboardType === 'by-topic') {
      loadTopics();
      if (selectedTopic) {
        loadTopicLeaderboard(selectedTopic);
      }
    } else if (leaderboardType === 'combined') {
      loadCombinedLeaderboard();
      loadMyTopicProfiles();
    }
  }, [navigate, viewMode, leaderboardType, selectedTopic]);

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white' };
    if (rank === 2) return { background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', color: 'white' };
    if (rank === 3) return { background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: 'white' };
    return { background: '#f3f4f6', color: '#6b7280' };
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    subtitle: { fontSize: '13px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.3s' },
    toggleContainer: { display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginTop: '16px' },
    toggleButton: { padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
    toggleButtonActive: { background: '#10b981', color: 'white' },
    toggleButtonInactive: { background: '#e5e7eb', color: '#6b7280' },
    errorMessage: { padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', width: '100%' },
    podium: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', marginBottom: '32px', padding: '32px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    podiumPlace: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' },
    podiumBase: { width: '100%', borderRadius: '12px 12px 0 0', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    medal: { fontSize: '32px', marginBottom: '8px' },
    playerName: { fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px', textAlign: 'center' },
    playerPoints: { fontSize: '18px', fontWeight: '700', color: 'white' },
    playerLevel: { fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginTop: '4px' },
    tableContainer: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' },
    currentUserRow: { background: '#f0fdf4', fontWeight: '600' },
    rankBadge: { display: 'inline-block', width: '40px', height: '40px', borderRadius: '50%', textAlign: 'center', lineHeight: '40px', fontWeight: '700', fontSize: '16px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>🏆 Leaderboard</h1>
              {/* ✅ NEW: Ranking explanation */}
              <p style={styles.subtitle}>
                <span>📊</span>
                <span>Ranked by Level (highest first), then Points</span>
              </p>
            </div>
            <button 
              style={styles.backButton} 
              onClick={() => navigate('/student')}
              onMouseEnter={(e) => e.target.style.background = '#4b5563'}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              ← Back to Dashboard
            </button>
          </div>
          
          {/* Leaderboard Type Tabs */}
          <div style={{ marginTop: '20px', borderBottom: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                style={{
                  padding: '12px 24px',
                  background: leaderboardType === 'overall' ? 'white' : 'transparent',
                  border: 'none',
                  borderBottom: leaderboardType === 'overall' ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: leaderboardType === 'overall' ? '#3b82f6' : '#6b7280',
                  transition: 'all 0.2s'
                }}
                onClick={() => setLeaderboardType('overall')}
              >
                📊 Overall Points
              </button>
              <button 
                style={{
                  padding: '12px 24px',
                  background: leaderboardType === 'combined' ? 'white' : 'transparent',
                  border: 'none',
                  borderBottom: leaderboardType === 'combined' ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: leaderboardType === 'combined' ? '#3b82f6' : '#6b7280',
                  transition: 'all 0.2s'
                }}
                onClick={() => setLeaderboardType('combined')}
              >
                📚 All Topics Combined
              </button>
              <button 
                style={{
                  padding: '12px 24px',
                  background: leaderboardType === 'by-topic' ? 'white' : 'transparent',
                  border: 'none',
                  borderBottom: leaderboardType === 'by-topic' ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: leaderboardType === 'by-topic' ? '#3b82f6' : '#6b7280',
                  transition: 'all 0.2s'
                }}
                onClick={() => setLeaderboardType('by-topic')}
              >
                🎯 By Topic
              </button>
            </div>
          </div>

          {/* Topic Selection (only for by-topic view) */}
          {leaderboardType === 'by-topic' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Select Topic to View Rankings:
              </span>
              {availableTopics.length > 0 ? (
                <select 
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'white',
                    color: '#1f2937'
                  }}
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  {availableTopics.map(topic => (
                    <option key={topic} value={topic}>
                      {topic === 'Addition' && '➕ Addition'}
                      {topic === 'Subtraction' && '➖ Subtraction'}
                      {topic === 'Multiplication' && '✖️ Multiplication'}
                      {topic === 'Division' && '➗ Division'}
                      {!['Addition', 'Subtraction', 'Multiplication', 'Division'].includes(topic) && `📚 ${topic}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                  No topics available yet
                </span>
              )}
            </div>
          )}
          
          <div style={styles.toggleContainer}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>View:</span>
            <button 
              style={{
                ...styles.toggleButton,
                ...(viewMode === 'class' ? styles.toggleButtonActive : styles.toggleButtonInactive)
              }}
              onClick={() => setViewMode('class')}
            >
              My Class
            </button>
            <button 
              style={{
                ...styles.toggleButton,
                ...(viewMode === 'school' ? styles.toggleButtonActive : styles.toggleButtonInactive)
              }}
              onClick={() => setViewMode('school')}
            >
              My School
            </button>
          </div>
          
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ✅ Podium - Show top 3 with level info */}
        {leaderboard.length >= 3 && (
          <div style={styles.podium}>
            {topThree[1] && (
              <div style={styles.podiumPlace}>
                <div style={styles.medal}>🥈</div>
                <div style={{...styles.podiumBase, background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', height: '180px'}}>
                  <div style={styles.playerName}>{topThree[1].name}</div>
                  <div style={styles.playerLevel}>Level {topThree[1].level}</div>
                  <div style={styles.playerPoints}>{topThree[1].points} pts</div>
                </div>
              </div>
            )}
            {topThree[0] && (
              <div style={styles.podiumPlace}>
                <div style={styles.medal}>🥇</div>
                <div style={{...styles.podiumBase, background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', height: '220px'}}>
                  <div style={styles.playerName}>{topThree[0].name}</div>
                  <div style={styles.playerLevel}>Level {topThree[0].level}</div>
                  <div style={styles.playerPoints}>{topThree[0].points} pts</div>
                </div>
              </div>
            )}
            {topThree[2] && (
              <div style={styles.podiumPlace}>
                <div style={styles.medal}>🥉</div>
                <div style={{...styles.podiumBase, background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', height: '140px'}}>
                  <div style={styles.playerName}>{topThree[2].name}</div>
                  <div style={styles.playerLevel}>Level {topThree[2].level}</div>
                  <div style={styles.playerPoints}>{topThree[2].points} pts</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ Leaderboard Table */}
        {leaderboard.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rank</th>
                  <th style={styles.th}>Player</th>
                  {leaderboardType === 'overall' && <th style={styles.th}>Level</th>}
                  <th style={styles.th}>Points</th>
                  {leaderboardType === 'by-topic' && (
                    <>
                      <th style={styles.th}>Accuracy</th>
                      <th style={styles.th}>Quizzes</th>
                    </>
                  )}
                  {leaderboardType === 'combined' && (
                    <>
                      <th style={styles.th}>Topics</th>
                      <th style={styles.th}>Avg Accuracy</th>
                    </>
                  )}
                  {leaderboardType === 'overall' && <th style={styles.th}>Achievements</th>}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(player => (
                  <tr key={player.rank || player.userId} style={player.isCurrentUser ? styles.currentUserRow : {}}>
                    <td style={styles.td}>
                      <span style={{...styles.rankBadge, ...getRankBadgeStyle(player.rank)}}>
                        {player.rank <= 3 ? (player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉') : player.rank}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <strong>{player.name}</strong>{player.isCurrentUser && ' (You)'}
                    </td>
                    {leaderboardType === 'overall' && (
                      <td style={styles.td}>
                        {player.isCurrentUser 
                          ? (currentUserLevel === null ? '-' : `Level ${currentUserLevel}`)
                          : `Level ${player.level || 0}`}
                      </td>
                    )}
                    <td style={styles.td}>
                      <strong style={{ color: '#10b981' }}>{(player.totalPoints || player.points || 0).toLocaleString()}</strong>
                    </td>
                    {leaderboardType === 'by-topic' && (
                      <>
                        <td style={styles.td}>{player.averageAccuracy?.toFixed(1) || 0}%</td>
                        <td style={styles.td}>{player.quizzesTaken || 0}</td>
                      </>
                    )}
                    {leaderboardType === 'combined' && (
                      <>
                        <td style={styles.td}>{player.topicCount || 0}</td>
                        <td style={styles.td}>{player.averageAccuracy?.toFixed(1) || 0}%</td>
                      </>
                    )}
                    {leaderboardType === 'overall' && <td style={styles.td}>🏆 {player.achievements || 0}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No rankings yet</p>
            <p>The leaderboard will populate as students earn points and complete quizzes</p>
          </div>
        )}
      </div>
    </div>
  );
}