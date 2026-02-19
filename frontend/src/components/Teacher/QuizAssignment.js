import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function QuizAssignment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [launching, setLaunching] = useState(false);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [quizzesRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mongo/teacher/available-quizzes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_BASE_URL}/api/mongo/teacher/my-classes`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);

      const [quizzesData, classesData] = await Promise.all([
        quizzesRes.json(),
        classesRes.json()
      ]);

      if (quizzesData.success) {
        setAvailableQuizzes(quizzesData.quizzes || []);
      }

      if (classesData.success) {
        // Normalize class data structure - ensure all items have class_name property
        // The API may return either strings or objects depending on the data source:
        // - Direct class names from teacher.assignedClasses (strings)
        // - Full class objects from Class.find() (objects with class_name)
        const normalizedClasses = (classesData.classes || []).map(classItem => {
          if (typeof classItem === 'string') {
            return { class_name: classItem };
          }
          return classItem;
        });
        setMyClasses(normalizedClasses);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openLaunchModal = (quiz) => {
    setSelectedQuiz(quiz);
    setSelectedClasses([]);
    setShowLaunchModal(true);
  };

  const handleLaunchQuiz = async () => {
    if (selectedClasses.length === 0) {
      alert('Please select at least one class');
      return;
    }

    setLaunching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/launch-quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quizId: selectedQuiz._id,
          classes: selectedClasses
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}`);
        setShowLaunchModal(false);
        fetchData();
      } else {
        alert(`❌ ${data.error || 'Failed to launch quiz'}`);
      }
    } catch (error) {
      console.error('Launch error:', error);
      alert('Failed to launch quiz. Please try again.');
    } finally {
      setLaunching(false);
    }
  };

  const handleRevokeQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to disable this quiz for your classes?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/revoke-quiz/${quizId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Quiz disabled successfully');
        fetchData();
      } else {
        alert(`❌ ${data.error || 'Failed to disable quiz'}`);
      }
    } catch (error) {
      console.error('Revoke error:', error);
      alert('Failed to disable quiz. Please try again.');
    }
  };

  const toggleClassSelection = (className) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px 32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' },
    backBtn: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    infoBox: { background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    card: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    cardTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' },
    cardDesc: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' },
    badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
    activeBadge: { background: '#d1fae5', color: '#065f46' },
    inactiveBadge: { background: '#fee2e2', color: '#991b1b' },
    levelBadge: { background: '#fef3c7', color: '#92400e', marginLeft: '8px' },
    classTags: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
    classTag: { padding: '4px 10px', background: '#e0e7ff', color: '#3730a3', borderRadius: '8px', fontSize: '12px' },
    btnPrimary: { padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '12px', width: '100%' },
    btnDanger: { padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '12px', width: '100%' },
    btnDisabled: { padding: '8px 16px', background: '#d1d5db', color: '#6b7280', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: '600', fontSize: '14px', marginTop: '12px', width: '100%' },
    empty: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1f2937' },
    classCheckbox: { display: 'flex', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' },
    checkboxInput: { marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' },
    modalBtns: { display: 'flex', gap: '12px', marginTop: '24px' },
    btnSecondary: { flex: 1, padding: '10px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
  };

  if (loading) {
    return <div style={styles.container}><div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎯 Launch Quiz</h1>
          <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        </div>

        <div style={styles.infoBox}>
          <p style={{ margin: 0, color: '#1e40af' }}>
            ℹ️ Enable quizzes for your classes. Students can only access quizzes that you've enabled. Level 1 (Placement Quiz) requires an active teacher.
          </p>
        </div>

        {availableQuizzes.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No Quizzes Available</p>
            <p>Quizzes will appear here when created by P2L Admin</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {availableQuizzes.map(quiz => {
              const isLaunched = quiz.is_launched;
              const launchedByMe = quiz.launchedByMe;
              
              return (
                <div key={quiz._id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={styles.cardTitle}>
                      {quiz.title}
                      {quiz.quiz_level && (
                        <span style={styles.levelBadge}>Level {quiz.quiz_level}</span>
                      )}
                    </h3>
                    <span style={{ ...styles.badge, ...(isLaunched ? styles.activeBadge : styles.inactiveBadge) }}>
                      {isLaunched ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </div>
                  <p style={styles.cardDesc}>{quiz.description || 'Adaptive quiz'}</p>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    <p style={{ margin: '4px 0' }}>Type: {quiz.quiz_type || 'adaptive'}</p>
                    {quiz.quiz_level === 1 && (
                      <p style={{ margin: '4px 0', color: '#d97706', fontWeight: '500' }}>🎯 Placement Quiz</p>
                    )}
                    {quiz.launched_for_classes && quiz.launched_for_classes.length > 0 && (
                      <div style={styles.classTags}>
                        <span style={{ marginRight: '8px' }}>Classes:</span>
                        {quiz.launched_for_classes.map((cls, i) => (
                          <span key={i} style={styles.classTag}>{cls}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {!isLaunched ? (
                    <button 
                      style={styles.btnPrimary}
                      onClick={() => openLaunchModal(quiz)}
                    >
                      Enable for Classes
                    </button>
                  ) : launchedByMe ? (
                    <button 
                      style={styles.btnDanger}
                      onClick={() => handleRevokeQuiz(quiz._id)}
                    >
                      Disable Quiz
                    </button>
                  ) : (
                    <button style={styles.btnDisabled} disabled>
                      Enabled by Another Teacher
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Launch Modal */}
      {showLaunchModal && selectedQuiz && (
        <div style={styles.modal} onClick={() => setShowLaunchModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Enable Quiz: {selectedQuiz.title}</h2>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
              Select the classes you want to enable this quiz for:
            </p>
            
            {myClasses.length === 0 ? (
              <p style={{ color: '#ef4444' }}>No classes assigned to you</p>
            ) : (
              <div>
                {myClasses.map((classItem) => {
                  // Now all classes have class_name property due to normalization
                  const className = classItem.class_name;
                  return (
                    <label 
                      key={className} 
                      style={styles.classCheckbox}
                      htmlFor={`class-${className}`}
                    >
                      <input
                        id={`class-${className}`}
                        type="checkbox"
                        style={styles.checkboxInput}
                        checked={selectedClasses.includes(className)}
                        onChange={() => toggleClassSelection(className)}
                      />
                      <span>{className}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div style={styles.modalBtns}>
              <button 
                style={styles.btnSecondary}
                onClick={() => setShowLaunchModal(false)}
                disabled={launching}
              >
                Cancel
              </button>
              <button 
                style={{ ...styles.btnPrimary, flex: 1 }}
                onClick={handleLaunchQuiz}
                disabled={launching || selectedClasses.length === 0}
              >
                {launching ? 'Enabling...' : 'Enable Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
