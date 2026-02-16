import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);

  const getToken = () => localStorage.getItem('token');

  // Function to load dashboard data
  const loadDashboardData = async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      // Get user from localStorage first (fast)
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // Then fetch fresh data from server
      const result = await authService.getCurrentUserFromServer();
      if (result.success) {
        setUser(result.user);
      }

      // ✅ FIXED: Load dashboard data first to check placement status
      const dashData = await studentService.getDashboard();
      console.log('📊 Dashboard data loaded:', dashData);

      if (dashData.success) {
        const dashboardInfo = dashData.dashboard || dashData.data || {};
        const placementCompleted = dashboardInfo.placementCompleted || false;

        let adaptiveLevel = 0; // ✅ DEFAULT TO 0 FOR NEW USERS

        // ✅ ONLY fetch quiz level if placement is completed
        if (placementCompleted) {
          try {
            const levelResponse = await fetch(`${API_BASE_URL}/api/adaptive-quiz/student/current-level`, {
              headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const levelData = await levelResponse.json();
            
            if (levelData.success) {
              adaptiveLevel = levelData.currentLevel || 1;
              console.log('✅ Quiz Journey level loaded:', adaptiveLevel);
            }
          } catch (levelError) {
            console.warn('⚠️ Could not fetch quiz journey level:', levelError);
            adaptiveLevel = 1; // Default to 1 if fetch fails but placement is done
          }
        } else {
          console.log('📌 Placement NOT completed - showing Level 0');
        }

        const points = dashboardInfo.totalPoints ?? dashboardInfo.points ?? 0;
        const completedQuizzes = dashboardInfo.completedQuizzes ?? dashboardInfo.quizzesTaken ?? 0;
        const gradeLevel = dashboardInfo.gradeLevel ?? 'Primary 1';

        // ✅ FIX 1: Only fetch rank if placement is completed
        // ✅ FIX 2: Fetch CLASS leaderboard (not school-wide)
        let userRank = '#-';
        
        if (placementCompleted) {
          try {
            // ✅ CRITICAL: Pass BOTH schoolId and classId to get class-only leaderboard
            const leaderboardData = await studentService.getLeaderboard(
              currentUser.schoolId,  // School ID
              currentUser.class      // ✅ Class ID (not null!)
            );
            
            console.log('📊 Class leaderboard data:', leaderboardData);
            
            if (leaderboardData.success && leaderboardData.leaderboard) {
              const currentUserRank = leaderboardData.leaderboard.find(
                (entry) => entry.isCurrentUser
              );
              if (currentUserRank) {
                userRank = `#${currentUserRank.rank}`;
                console.log('✅ Your class rank:', userRank);
              } else {
                console.warn('⚠️ Current user not found in class leaderboard');
              }
            }
          } catch (leaderboardError) {
            console.warn('⚠️ Could not fetch class leaderboard:', leaderboardError);
          }
        } else {
          console.log('📌 Placement not completed - rank will show as "#-"');
        }

        setDashboardData({
          points,
          level: adaptiveLevel, // ✅ WILL BE 0 IF PLACEMENT NOT DONE
          levelProgress: placementCompleted ? ((adaptiveLevel / 10) * 100) : 0, // ✅ 0% if not placed
          achievements: dashboardInfo.achievements || 0,
          rank: userRank, // ✅ WILL BE "#-" IF PLACEMENT NOT DONE
          completedQuizzes,
          grade_level: gradeLevel,
          placementCompleted: placementCompleted,
        });
        console.log('✅ Dashboard data set - Level:', adaptiveLevel, 'Placement:', placementCompleted, 'Rank:', userRank);
      } else {
        console.error('❌ Failed to load dashboard:', dashData.error);
        // Set default values
        setDashboardData({
          points: 0,
          level: 0, // ✅ DEFAULT TO 0
          levelProgress: 0,
          achievements: 0,
          rank: '#-',
          completedQuizzes: 0,
          grade_level: 'Primary 1',
          placementCompleted: false,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboardData({
        points: 0,
        level: 0, // ✅ DEFAULT TO 0
        levelProgress: 0,
        achievements: 0,
        rank: '#-',
        completedQuizzes: 0,
        grade_level: 'Primary 1',
        placementCompleted: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load dashboard data on mount
    loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    // 🔄 FIXED: Refresh dashboard when window regains focus
    // This ensures updated quiz data is fetched when returning from quiz page
    const handleFocus = () => {
      console.log('🔄 Window focus detected, refreshing dashboard...');
      setLoading(true);
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user || !dashboardData) {
    return (
      <div style={styles.errorContainer}>
        <h2>Unable to load dashboard</h2>
        <p>Please try refreshing the page.</p>
        <button style={styles.button} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    );
  }

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View and update your profile',
      icon: '👤',
      action: () => navigate('/student/profile'),
    },
    {
      id: 'adaptive-quiz',
      title: 'Quiz',
      description: 'Play adaptive quizzes and level up',
      icon: '🎲',
      action: () => navigate('/student/quiz/attempt'),
    },
    {
      id: 'skills',
      title: 'Skill Matrix',
      description: 'See your unlocked math skills',
      icon: '📊',
      action: () => navigate('/student/skills'),
    },
    {
      id: 'results',
      title: 'View Results',
      description: 'Review your quiz results and history',
      icon: '📝',
      action: () => navigate('/student/results'),
    },
    {
      id: 'progress',
      title: 'Track Progress',
      description: 'View your learning progress and stats',
      icon: '📈',
      action: () => navigate('/student/progress'),
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See how you rank against classmates',
      icon: '🏆',
      action: () => navigate('/student/leaderboard'),
    },
    {
      id: 'announcements',
      title: 'School Announcements',
      description: 'View important school updates',
      icon: '📢',
      action: () => navigate('/student/announcements'),
    },
    {
      id: 'news',
      title: 'News & Updates',
      description: 'View system news and broadcast messages',
      icon: '📰',
      action: () => navigate('/student/news'),
    },
    {
      id: 'testimonial',
      title: 'Write Testimonial',
      description: 'Share feedback about your experience',
      icon: '💬',
      action: () => navigate('/student/testimonial'),
    },
    {
      id: 'support',
      title: 'Create Support Ticket',
      description: 'Need help? Contact support',
      icon: '🛠️',
      action: () => navigate('/student/support'),
    },
    {
      id: 'trackTicket',
      title: 'Track Support Ticket',
      description: 'View your submitted support requests',
      icon: '📩',
      action: () => navigate('/student/support/tickets'),
    },
    {
      id: 'shop',
      title: 'Reward Shop',
      description: 'Spend your points on cool rewards',
      icon: '🛒',
      action: () => navigate('/student/shop'),
    },
    {
      id: 'badges',
      title: 'Badges',
      description: 'View earned badges',
      icon: '🏆',
      action: () => navigate('/student/badges'),
    },
  ];

  const statCards = [
    {
      id: 'points',
      title: 'Total Points',
      value: dashboardData.points,
      icon: '⭐',
    },
    {
      id: 'level',
      title: 'Current Level',
      value: dashboardData.level === 0 ? '-' : dashboardData.level, // ✅ SHOW "-" IF LEVEL IS 0
      icon: '🎯',
    },
    {
      id: 'achievements',
      title: 'Achievements',
      value: dashboardData.achievements,
      icon: '🏅',
    },
    {
      id: 'rank',
      title: 'Class Rank', // ✅ CHANGED: Clarify it's CLASS rank
      value: dashboardData.rank,
      icon: '🏆',
    },
    {
      id: 'quizzes',
      title: 'Completed Quizzes',
      value: dashboardData.completedQuizzes,
      icon: '📝',
    },
  ];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>P</div>
          <h1 style={styles.logoText}>Play2Learn</h1>
        </div>
        <div style={styles.userArea}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name || 'Student'}</span>
            <span style={styles.userRole}>{user.role || 'Student'}</span>
          </div>
          <button
            style={styles.logoutButton}
            onClick={() => {
              authService.logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcomeCard}>
          <h2 style={styles.welcomeTitle}>
            Welcome back, {user.name?.split(' ')[0] || 'Student'}! 🎮
          </h2>
          <p style={styles.gradeLevel}>{dashboardData.grade_level}</p>
          <div style={styles.progressContainer}>
            <div style={styles.progressText}>
              {/* ✅ SHOW DIFFERENT MESSAGE IF PLACEMENT NOT DONE */}
              {dashboardData.level === 0 
                ? 'Complete Placement Quiz to unlock your journey!' 
                : `Level ${dashboardData.level} - ${dashboardData.levelProgress.toFixed(0)}% Journey Completion`}
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${dashboardData.levelProgress}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div style={styles.statsGrid}>
          {statCards.map((stat) => (
            <div
              key={stat.id}
              style={{
                ...styles.statCard,
                ...(hoveredStat === stat.id ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredStat(stat.id)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={styles.statIcon}>{stat.icon}</div>
              <div style={styles.statTitle}>{stat.title}</div>
              <div style={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={styles.menuGrid}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.menuItem,
                ...(hoveredItem === item.id ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={item.action}
            >
              <div style={styles.menuIcon}>{item.icon}</div>
              <div style={styles.menuContent}>
                <h3 style={styles.menuTitle}>{item.title}</h3>
                <p style={styles.menuDescription}>{item.description}</p>
              </div>
              <div style={styles.arrow}>→</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    backgroundColor: '#fff',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  logoText: { margin: 0, fontSize: '20px', color: '#111827' },
  userArea: { display: 'flex', alignItems: 'center', gap: '15px' },
  userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  userName: { fontWeight: 'bold', color: '#111827' },
  userRole: { fontSize: '12px', color: '#6b7280' },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  main: { padding: '30px', maxWidth: '1200px', margin: '0 auto' },
  welcomeCard: {
    backgroundColor: '#10b981',
    color: '#fff',
    borderRadius: '16px',
    padding: '25px',
    marginBottom: '25px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  welcomeTitle: { margin: 0, fontSize: '28px', fontWeight: 'bold' },
  gradeLevel: { marginTop: '8px', marginBottom: '10px', opacity: 0.95 },
  progressContainer: { marginTop: '10px' },
  progressText: { fontSize: '14px', marginBottom: '8px' },
  progressBar: {
    height: '10px',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '18px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    textAlign: 'center',
    cursor: 'default',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  statIcon: { fontSize: '26px', marginBottom: '8px' },
  statTitle: { color: '#6b7280', fontSize: '13px' },
  statValue: { fontSize: '26px', fontWeight: 'bold', marginTop: '6px' },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '18px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  menuIcon: { fontSize: '26px', marginRight: '12px' },
  menuContent: { flex: 1 },
  menuTitle: { margin: 0, color: '#111827' },
  menuDescription: { margin: '6px 0 0', color: '#6b7280', fontSize: '13px' },
  arrow: { fontSize: '18px', color: '#9ca3af' },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 18px rgba(0,0,0,0.10)',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingSpinner: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #10b981',
    animation: 'spin 1s linear infinite',
  },
  loadingText: { marginTop: '15px', color: '#6b7280' },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    padding: '20px',
    textAlign: 'center',
  },
  button: {
    marginTop: '14px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};