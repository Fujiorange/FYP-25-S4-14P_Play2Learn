import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [error, setError] = useState('');
  
  // ✅ NEW: Topic-based leaderboard state
  const [viewMode, setViewMode] = useState('overall'); // 'overall', 'combined', 'by-topic'
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicLeaderboard, setTopicLeaderboard] = useState([]);
  const [combinedLeaderboard, setCombinedLeaderboard] = useState([]);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    loadData();
  }, [navigate]);

  useEffect(() => {
    if (selectedClass === 'all') {
      setFilteredStudents(allStudents);
    } else {
      const filtered = allStudents.filter(s => s.className === selectedClass);
      setFilteredStudents(filtered);
    }
  }, [selectedClass, allStudents]);

  const loadData = async () => {
    try {
      setError('');
      
      // Get classes first
      const classRes = await fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const classData = await classRes.json();
      
      let classNames = [];
      let classIds = [];
      if (classData.success) {
        classNames = classData.classes || [];
        classIds = classData.classIds || [];
      }
      setMyClasses(classNames);
      
      // Create ID to name map
      const idToName = {};
      classNames.forEach((name, i) => {
        if (classIds[i]) idToName[classIds[i]] = name;
      });
      
      // Get leaderboard
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/leaderboard`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const students = (data.leaderboard || []).map((s, i) => ({
          ...s,
          rank: i + 1,
          className: idToName[s.class] || s.class || 'Unknown'
        }));
        setAllStudents(students);
        setFilteredStudents(students);
      } else {
        setError(data.error || 'Failed to load');
      }
    } catch (e) { 
      console.error(e); 
      setError('Failed to connect');
    }
    finally { setLoading(false); }
  };

  // ✅ NEW: Load available topics
  const loadTopics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/leaderboard/topics`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setAvailableTopics(data.topics || []);
        if (data.topics && data.topics.length > 0 && !selectedTopic) {
          setSelectedTopic(data.topics[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load topics:', e);
    }
  };

  // ✅ NEW: Load topic-specific leaderboard
  const loadTopicLeaderboard = async (topic, className = 'all') => {
    if (!topic) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({ topic });
      if (className && className !== 'all') {
        params.append('className', className);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/leaderboard/by-topic?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setTopicLeaderboard(data.leaderboard || []);
      } else {
        setError(data.error || 'Failed to load topic leaderboard');
      }
    } catch (e) {
      console.error('Failed to load topic leaderboard:', e);
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Load combined leaderboard across all topics
  const loadCombinedLeaderboard = async (className = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (className && className !== 'all') {
        params.append('className', className);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/mongo/teacher/leaderboard/combined?${params}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setCombinedLeaderboard(data.leaderboard || []);
      } else {
        setError(data.error || 'Failed to load combined leaderboard');
      }
    } catch (e) {
      console.error('Failed to load combined leaderboard:', e);
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle view mode change
  useEffect(() => {
    if (viewMode === 'overall') {
      loadData();
    } else if (viewMode === 'by-topic') {
      loadTopics();
      if (selectedTopic) {
        loadTopicLeaderboard(selectedTopic, selectedClass);
      }
    } else if (viewMode === 'combined') {
      loadCombinedLeaderboard(selectedClass);
    }
  }, [viewMode]);

  // ✅ NEW: Handle topic change
  useEffect(() => {
    if (viewMode === 'by-topic' && selectedTopic) {
      loadTopicLeaderboard(selectedTopic, selectedClass);
    }
  }, [selectedTopic]);

  // ✅ NEW: Handle class filter change for topic leaderboards
  useEffect(() => {
    if (viewMode === 'by-topic' && selectedTopic) {
      loadTopicLeaderboard(selectedTopic, selectedClass);
    } else if (viewMode === 'combined') {
      loadCombinedLeaderboard(selectedClass);
    }
  }, [selectedClass]);

  const getRankDisplay = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '900px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    filterRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    filterLabel: { fontWeight: '500', color: '#374151' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px', minWidth: '200px', cursor: 'pointer' },
    podiumContainer: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
    podiumCard: { background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', minWidth: '140px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    podiumFirst: { transform: 'scale(1.1)', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' },
    podiumRank: { fontSize: '36px', marginBottom: '8px' },
    podiumName: { fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    podiumClass: { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
    podiumPoints: { fontSize: '20px', fontWeight: '700', color: '#10b981' },
    tableContainer: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px 20px', textAlign: 'left', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
    td: { padding: '16px 20px', borderBottom: '1px solid #f3f4f6' },
    rankCell: { fontWeight: '700', fontSize: '18px' },
    nameCell: { fontWeight: '600', color: '#1f2937' },
    classBadge: { display: 'inline-block', padding: '4px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
    pointsCell: { fontWeight: '700', color: '#10b981', fontSize: '16px' },
    empty: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    error: { background: '#fee2e2', color: '#dc2626', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' },
    // ✅ NEW: Tab styles
    tabsContainer: { display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' },
    tab: { padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#6b7280', transition: 'all 0.2s' },
    activeTab: { color: '#3b82f6', borderBottomColor: '#3b82f6' },
    topicCard: { display: 'inline-block', padding: '6px 16px', background: '#e0e7ff', color: '#3730a3', borderRadius: '16px', fontSize: '14px', fontWeight: '600', marginBottom: '8px' },
  };

  if (loading) return <div style={styles.container}><div style={{ textAlign: 'center', marginTop: '100px', color: '#6b7280' }}>Loading leaderboard...</div></div>;

  // Determine current leaderboard data
  const currentLeaderboard = viewMode === 'overall' ? filteredStudents : 
                              viewMode === 'by-topic' ? topicLeaderboard :
                              combinedLeaderboard;
  const top3 = currentLeaderboard.slice(0, 3);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🏆 Class Leaderboard</h1>
            <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
          </div>
          
          {/* ✅ NEW: View Mode Tabs */}
          <div style={styles.tabsContainer}>
            <button 
              style={{...styles.tab, ...(viewMode === 'overall' ? styles.activeTab : {})}}
              onClick={() => setViewMode('overall')}
            >
              📊 Overall Points
            </button>
            <button 
              style={{...styles.tab, ...(viewMode === 'combined' ? styles.activeTab : {})}}
              onClick={() => setViewMode('combined')}
            >
              📚 All Topics Combined
            </button>
            <button 
              style={{...styles.tab, ...(viewMode === 'by-topic' ? styles.activeTab : {})}}
              onClick={() => setViewMode('by-topic')}
            >
              🎯 By Topic
            </button>
          </div>
          
          {/* Filters Row */}
          <div style={styles.filterRow}>
            <span style={styles.filterLabel}>Filter by Class:</span>
            <select style={styles.select} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="all">All Classes</option>
              {myClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            
            {/* ✅ NEW: Topic selector for by-topic view */}
            {viewMode === 'by-topic' && availableTopics.length > 0 && (
              <>
                <span style={styles.filterLabel}>Topic:</span>
                <select style={styles.select} value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                  {availableTopics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        {!error && currentLeaderboard.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No students found</p>
            <p>Students will appear here once they earn points</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div style={styles.podiumContainer}>
                {top3[1] && (
                  <div style={styles.podiumCard}>
                    <div style={styles.podiumRank}>🥈</div>
                    <div style={styles.podiumName}>{top3[1].name}</div>
                    <div style={styles.podiumClass}>{top3[1].class || top3[1].className}</div>
                    <div style={styles.podiumPoints}>{top3[1].totalPoints || top3[1].points || 0} pts</div>
                  </div>
                )}
                {top3[0] && (
                  <div style={{ ...styles.podiumCard, ...styles.podiumFirst }}>
                    <div style={styles.podiumRank}>🥇</div>
                    <div style={styles.podiumName}>{top3[0].name}</div>
                    <div style={styles.podiumClass}>{top3[0].class || top3[0].className}</div>
                    <div style={styles.podiumPoints}>{top3[0].totalPoints || top3[0].points || 0} pts</div>
                  </div>
                )}
                {top3[2] && (
                  <div style={styles.podiumCard}>
                    <div style={styles.podiumRank}>🥉</div>
                    <div style={styles.podiumName}>{top3[2].name}</div>
                    <div style={styles.podiumClass}>{top3[2].class || top3[2].className}</div>
                    <div style={styles.podiumPoints}>{top3[2].totalPoints || top3[2].points || 0} pts</div>
                  </div>
                )}
              </div>
            )}

            {/* Full Table */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Rank</th>
                    <th style={styles.th}>Student</th>
                    <th style={styles.th}>Class</th>
                    <th style={styles.th}>Points</th>
                    {viewMode === 'overall' && <th style={styles.th}>Level</th>}
                    {viewMode === 'by-topic' && (
                      <>
                        <th style={styles.th}>Accuracy</th>
                        <th style={styles.th}>Quizzes</th>
                      </>
                    )}
                    {viewMode === 'combined' && (
                      <>
                        <th style={styles.th}>Topics</th>
                        <th style={styles.th}>Avg Accuracy</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentLeaderboard.map((s, i) => (
                    <tr key={s._id || s.userId}>
                      <td style={{ ...styles.td, ...styles.rankCell }}>{getRankDisplay(s.rank || i + 1)}</td>
                      <td style={{ ...styles.td, ...styles.nameCell }}>{s.name}</td>
                      <td style={styles.td}><span style={styles.classBadge}>{s.class || s.className}</span></td>
                      <td style={{ ...styles.td, ...styles.pointsCell }}>{s.totalPoints || s.points || 0}</td>
                      {viewMode === 'overall' && <td style={styles.td}>Lv {s.level || 1}</td>}
                      {viewMode === 'by-topic' && (
                        <>
                          <td style={styles.td}>{s.averageAccuracy?.toFixed(1) || 0}%</td>
                          <td style={styles.td}>{s.quizzesTaken || 0}</td>
                        </>
                      )}
                      {viewMode === 'combined' && (
                        <>
                          <td style={styles.td}>{s.topicCount || 0}</td>
                          <td style={styles.td}>{s.averageAccuracy?.toFixed(1) || 0}%</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
