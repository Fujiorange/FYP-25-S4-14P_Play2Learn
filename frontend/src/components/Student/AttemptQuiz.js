// src/pages/student/AttemptQuiz.js
// AttemptQuiz.js - Shows both Placement Quiz and Quiz Journey options

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import studentService from "../../services/studentService";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function AttemptQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [placementCompleted, setPlacementCompleted] = useState(false);
  const [error, setError] = useState("");

  const [placementTopics, setPlacementTopics] = useState({ available: [], completed: [] });
  const [quizJourneyTopics, setQuizJourneyTopics] = useState([]);

  useEffect(() => {
    loadQuizData();
    loadTopics();
    
    // ✅ AUTO-REFRESH when user navigates back to this page
    const handleFocus = () => {
      console.log('🔄 Page focus detected, refreshing quiz data...');
      loadQuizData();
      loadTopics();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [navigate]);

  const loadTopics = async () => {
    try {
      // Load placement topics
      const placementResponse = await fetch(`${API_BASE_URL}/api/mongo/student/placement-quiz/topics`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const placementData = await placementResponse.json();
      
      if (placementData.success) {
        setPlacementTopics({
          available: placementData.availableTopics || [],
          completed: placementData.completedTopics || []
        });
      }

      // Load quiz journey topics (available quizzes grouped by topic)
      const quizResponse = await fetch(`${API_BASE_URL}/api/adaptive-quiz/quizzes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const quizData = await quizResponse.json();
      
      if (quizData.success) {
        // Group quizzes by topic
        const topicsMap = {};
        quizData.data.forEach(quiz => {
          const topic = quiz.topic || 'General';
          if (!topicsMap[topic]) {
            topicsMap[topic] = {
              topic,
              levels: [],
              minLevel: Infinity,
              maxLevel: -Infinity
            };
          }
          topicsMap[topic].levels.push(quiz.quiz_level);
          topicsMap[topic].minLevel = Math.min(topicsMap[topic].minLevel, quiz.quiz_level);
          topicsMap[topic].maxLevel = Math.max(topicsMap[topic].maxLevel, quiz.quiz_level);
        });
        
        setQuizJourneyTopics(Object.values(topicsMap));
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadQuizData = async () => {
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Fetching placement status and math profile...");
      
      // Check placement status first
      const placementResult = await studentService.getPlacementStatus();
      const isPlacementDone = placementResult?.success && (placementResult?.placementCompleted || placementResult?.placement_completed);
      setPlacementCompleted(isPlacementDone);
      
      console.log("📥 Placement completed:", isPlacementDone);

      // Then fetch math profile for daily limits
      const result = await studentService.getMathProfile();
      console.log("📥 Profile result:", result);

      if (!result?.success) {
        setError("Failed to load quiz data");
        setProfileData(null);
        return;
      }

      const mp = result.mathProfile || null;

      if (mp) {
        // Backend daily limit is 2 quizzes/day
        const dailyLimit = 2;
        const quizzesToday = Number.isFinite(mp.quizzes_today) ? mp.quizzes_today : 0;
        const attemptsRemaining = Number.isFinite(mp.quizzes_remaining)
          ? mp.quizzes_remaining
          : Math.max(0, dailyLimit - quizzesToday);

        const currentProfile = Number.isFinite(mp.current_profile) ? mp.current_profile : 1;

        setProfileData({
          current_profile: currentProfile,
          profile_name: `Profile ${currentProfile}`,
          total_points: Number.isFinite(mp.total_points) ? mp.total_points : 0,
          quizzes_today: quizzesToday,
          attemptsRemaining,
          attemptsUsed: dailyLimit - attemptsRemaining,
          dailyLimit,
        });
      } else {
        // No profile yet - set defaults
        setProfileData({
          current_profile: 1,
          profile_name: "Profile 1",
          total_points: 0,
          quizzes_today: 0,
          attemptsRemaining: 2,
          attemptsUsed: 0,
          dailyLimit: 2,
        });
      }
    } catch (e) {
      console.error("❌ Load quiz data error:", e);
      setError("Failed to load quiz data");
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UNLIMITED ATTEMPTS - No restrictions on quiz taking
  const canTakeQuiz = true; // Always allow quiz attempts

  const handleStartQuizJourney = () => {
    if (!placementCompleted) {
      alert("⚠️ Please complete the Placement Quiz first before starting the Quiz Journey!");
      return;
    }
    // ✅ REMOVED DAILY LIMIT CHECK - Users can take unlimited quizzes
    // Navigate to Quiz Journey
    navigate("/student/quiz-journey");
  };

  const handleStartPlacement = (topic) => {
    navigate(`/student/quiz/placement?topic=${encodeURIComponent(topic)}`);
  };

  const handleStartQuizJourneyTopic = (topic) => {
    navigate(`/student/quiz-journey?topic=${encodeURIComponent(topic)}`);
  };

  const getTopicEmoji = (topic) => {
    const emojiMap = {
      'Addition': '➕',
      'Subtraction': '➖',
      'Multiplication': '✖️',
      'Division': '➗'
    };
    return emojiMap[topic] || '📚';
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)",
      padding: "32px",
    },
    content: { maxWidth: "1200px", margin: "0 auto" },
    header: {
      background: "white",
      borderRadius: "16px",
      padding: "32px",
      marginBottom: "24px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px",
    },
    title: { fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 },
    backButton: {
      padding: "10px 20px",
      background: "#6b7280",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s",
    },
    errorMessage: {
      padding: "12px 16px",
      background: "#fee2e2",
      color: "#991b1b",
      borderRadius: "8px",
      marginBottom: "16px",
      fontSize: "14px",
      width: "100%",
    },
    cardsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "24px",
      marginTop: "24px",
    },
    quizCard: {
      background: "white",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      transition: "transform 0.3s, box-shadow 0.3s",
      cursor: "pointer",
    },
    quizCardHover: {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
    },
    quizIcon: { fontSize: "64px", marginBottom: "16px" },
    quizTitle: { fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "12px" },
    quizDescription: { fontSize: "14px", color: "#6b7280", marginBottom: "20px", lineHeight: "1.6" },
    statusBadge: {
      display: "inline-block",
      padding: "6px 16px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "16px",
    },
    completedBadge: {
      background: "#d1fae5",
      color: "#065f46",
    },
    pendingBadge: {
      background: "#fef3c7",
      color: "#92400e",
    },
    startButton: {
      padding: "14px 32px",
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s",
      width: "100%",
    },
    placementButton: {
      padding: "14px 32px",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s",
      width: "100%",
    },
    disabledButton: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    infoBox: {
      background: "#f9fafb",
      borderRadius: "12px",
      padding: "16px",
      marginTop: "16px",
      fontSize: "13px",
      color: "#4b5563",
      border: "2px solid #e5e7eb",
    },
    attemptsBox: {
      padding: "16px",
      borderRadius: "12px",
      marginTop: "16px",
      border: "2px solid",
      fontSize: "14px",
      fontWeight: "600",
      textAlign: "center",
    },
    loadingContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)",
    },
    loadingText: { fontSize: "24px", color: "#6b7280", fontWeight: "600" },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading quiz data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📝 Primary 1 Math Quiz</h1>
          <button
            style={styles.backButton}
            onClick={() => navigate("/student")}
            onMouseEnter={(e) => (e.target.style.background = "#4b5563")}
            onMouseLeave={(e) => (e.target.style.background = "#6b7280")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && <div style={styles.errorMessage}>⚠️ {error}</div>}

        {/* PLACEMENT QUIZ SECTION */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
            🎯 Placement Quiz
          </h2>
          
          {placementTopics.available.length === 0 && placementTopics.completed.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                ⚠️ No placement quizzes have been launched yet. Please wait for your teacher to launch a placement quiz.
              </p>
            </div>
          ) : (
            <>
              {placementTopics.available.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                    Available Topics:
                  </h3>
                  <div style={styles.topicGrid}>
                    {placementTopics.available.map((topic) => (
                      <div
                        key={topic}
                        style={styles.topicCard}
                        onClick={() => handleStartPlacement(topic)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                        }}
                      >
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{getTopicEmoji(topic)}</div>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                          {topic}
                        </h4>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                          Quiz Level 1
                        </p>
                        <button style={styles.topicButton}>
                          Start Placement
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {placementTopics.completed.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                    ✅ Completed Topics:
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {placementTopics.completed.map((topic) => (
                      <div
                        key={topic}
                        style={{
                          padding: '8px 16px',
                          background: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        ✓ {topic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* QUIZ JOURNEY SECTION */}
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '20px' }}>
            🚀 Quiz Journey
          </h2>
          
          {!placementCompleted ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>
                📌 Complete the Placement Quiz first to unlock the Quiz Journey!
              </p>
            </div>
          ) : quizJourneyTopics.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>
                ⚠️ No quiz journey topics are available yet. Please wait for your teacher to launch quizzes.
              </p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                Available Topics:
              </h3>
              <div style={styles.topicGrid}>
                {quizJourneyTopics.map((topicData) => (
                  <div
                    key={topicData.topic}
                    style={styles.topicCard}
                    onClick={() => handleStartQuizJourneyTopic(topicData.topic)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{getTopicEmoji(topicData.topic)}</div>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                      {topicData.topic}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                      Levels {topicData.minLevel}-{topicData.maxLevel} available
                    </p>
                    <button style={{
                      ...styles.topicButton,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    }}>
                      Start Journey
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)",
    padding: "32px",
  },
  content: { maxWidth: "1200px", margin: "0 auto" },
  header: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: { fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 },
  backButton: {
    padding: "10px 20px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  topicGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  topicCard: {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    cursor: "pointer",
    transition: "transform 0.3s, box-shadow 0.3s",
  },
  topicButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
  },
  errorMessage: {
    padding: "12px 16px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    width: "100%",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)",
  },
  loadingText: { fontSize: "24px", color: "#6b7280", fontWeight: "600" },
};

// Keep the old variables that are now unused
const unused = {
  styles: {
    cardsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "24px",
      marginTop: "24px",
    },
    quizCard: {
      background: "white",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      transition: "transform 0.3s, box-shadow 0.3s",
      cursor: "pointer",
    },
    quizCardHover: {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
    },
    quizIcon: { fontSize: "64px", marginBottom: "16px" },
    quizTitle: { fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "12px" },
    quizDescription: { fontSize: "14px", color: "#6b7280", marginBottom: "20px", lineHeight: "1.6" },
    statusBadge: {
      display: "inline-block",
      padding: "6px 16px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "16px",
    },
    completedBadge: {
      background: "#d1fae5",
      color: "#065f46",
    },
    pendingBadge: {
      background: "#fef3c7",
      color: "#92400e",
    },
    startButton: {
      padding: "14px 32px",
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s",
      width: "100%",
    },
    placementButton: {
      padding: "14px 32px",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s",
      width: "100%",
    },
    disabledButton: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    infoBox: {
      background: "#f9fafb",
      borderRadius: "12px",
      padding: "16px",
      marginTop: "16px",
      fontSize: "13px",
      color: "#4b5563",
      border: "2px solid #e5e7eb",
    },
    attemptsBox: {
      padding: "16px",
      borderRadius: "12px",
      marginTop: "16px",
      border: "2px solid",
      fontSize: "14px",
      fontWeight: "600",
      textAlign: "center",
    },
  }
};
                ...styles.statusBadge,
                ...(placementCompleted ? styles.completedBadge : styles.pendingBadge),
              }}
            >
              {placementCompleted ? "🔓 Unlocked" : "🔒 Locked"}
            </span>

            <p style={styles.quizDescription}>
              Progress through 10 levels of adaptive quizzes! Each level adapts to your skill and gets progressively challenging.
            </p>

            <button
              style={{
                ...styles.startButton,
                ...(!placementCompleted ? styles.disabledButton : {}),
              }}
              onClick={handleStartQuizJourney}
              disabled={!placementCompleted}
              onMouseEnter={(e) => {
                if (placementCompleted) e.target.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
              }}
            >
              {!placementCompleted
                ? "🔒 Complete Placement First"
                : "🚀 Start Quiz Journey"}
            </button>

            {!placementCompleted && (
              <div style={styles.infoBox}>
                🔒 Complete the Placement Quiz to unlock this!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}