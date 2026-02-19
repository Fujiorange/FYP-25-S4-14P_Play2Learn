// PlacementQuiz.js - Topic-Based Placement Quiz (First Time) - WITH TOPIC SELECTION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

export default function PlacementQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ NEW: Topic selection state
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showTopicSelection, setShowTopicSelection] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        console.log('📡 Loading available placement topics...');
        const result = await studentService.getPlacementTopics();
        console.log('📥 Topics result:', result);

        if (result.success) {
          setTopics(result);
          
          // If no available topics, show error
          if (!result.availableTopics || result.availableTopics.length === 0) {
            if (result.launchedTopics && result.launchedTopics.length > 0) {
              setError('✅ You have completed all available placement quizzes!');
            } else {
              setError('⏳ No placement quizzes have been launched yet. Please ask your teacher.');
            }
            setTimeout(() => navigate('/student/quiz/attempt'), 3000);
          }
        } else {
          setError(result.error || 'Failed to load topics');
        }
      } catch (error) {
        console.error('❌ Load topics error:', error);
        setError('Failed to load topics. Please try again.');
      } finally {
        setLoadingTopics(false);
      }
    };

    loadTopics();
  }, [navigate]);

  const handleTopicSelect = async (topic) => {
    setSelectedTopic(topic);
    setShowTopicSelection(false);
    setLoading(true);
    setError('');

    try {
      // Check if placement is already completed for this topic
      console.log('📡 Checking placement status for topic:', topic);
      const statusResult = await studentService.getPlacementStatus(topic);
      console.log('📥 Placement status:', statusResult);

      if (statusResult.success && statusResult.placementCompleted) {
        setError(`✅ You have already completed the placement quiz for ${topic}!`);
        setTimeout(() => {
          setShowTopicSelection(true);
          setSelectedTopic('');
        }, 2000);
        setLoading(false);
        return;
      }

      // Generate placement quiz for selected topic
      console.log('📡 Generating placement quiz for topic:', topic);
      const result = await studentService.generatePlacementQuiz(topic);
      console.log('📥 Quiz result:', result);

      if (result.success) {
        setQuizData(result);
        setAnswers(Array(result.total_questions).fill(''));
      } else {
        setError(result.error || 'Failed to load quiz');
        setTimeout(() => {
          setShowTopicSelection(true);
          setSelectedTopic('');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Load quiz error:', error);
      setError('Failed to load quiz. Please try again.');
      setTimeout(() => {
        setShowTopicSelection(true);
        setSelectedTopic('');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    // Accept any value (for both numeric and multiple choice answers)
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.total_questions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const unanswered = answers.filter(a => a === '').length;
    if (unanswered > 0) {
      if (!window.confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('📤 Submitting placement quiz...');
      console.log('Quiz ID:', quizData.quiz_id);
      console.log('Answers:', answers);

      const result = await studentService.submitPlacementQuiz(
        quizData.quiz_id,
        answers.map(a => a === '' ? '' : a) // Send answers as-is (strings or numbers)
      );

      console.log('📥 Submit result:', result);

      if (result.success) {
        // Navigate to result page with data
        navigate('/student/quiz/result', { 
          state: { 
            result: result.result,
            quizType: 'placement'
          } 
        });
      } else {
        setError(result.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: { 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', 
      padding: '32px' 
    },
    content: { 
      maxWidth: '900px', 
      margin: '0 auto' 
    },
    
    header: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '24px 32px', 
      marginBottom: '24px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    headerTop: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '16px' 
    },
    title: { 
      fontSize: '28px', 
      fontWeight: '700', 
      color: '#1f2937', 
      margin: 0 
    },
    badge: { 
      padding: '8px 16px', 
      background: '#3b82f6', 
      color: 'white', 
      borderRadius: '12px', 
      fontSize: '14px', 
      fontWeight: '600' 
    },
    subtitle: { 
      fontSize: '15px', 
      color: '#6b7280', 
      marginTop: '8px' 
    },
    
    progressBar: { 
      width: '100%', 
      height: '8px', 
      background: '#e5e7eb', 
      borderRadius: '4px', 
      overflow: 'hidden', 
      marginTop: '16px' 
    },
    progressFill: { 
      height: '100%', 
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
      transition: 'width 0.3s' 
    },
    
    errorMessage: { 
      padding: '12px 16px', 
      background: '#fee2e2', 
      color: '#991b1b', 
      borderRadius: '8px', 
      marginBottom: '16px', 
      fontSize: '14px' 
    },
    successMessage: { 
      padding: '12px 16px', 
      background: '#d1fae5', 
      color: '#065f46', 
      borderRadius: '8px', 
      marginBottom: '16px', 
      fontSize: '14px' 
    },
    
    quizCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '32px', 
      marginBottom: '24px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    
    questionHeader: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '24px' 
    },
    questionNumber: { 
      fontSize: '14px', 
      fontWeight: '600', 
      color: '#6b7280' 
    },
    operationBadge: { 
      padding: '4px 12px', 
      background: '#f0f9ff', 
      color: '#1e40af', 
      borderRadius: '8px', 
      fontSize: '13px', 
      fontWeight: '600', 
      border: '1px solid #3b82f6' 
    },
    
    questionText: { 
      fontSize: '32px', 
      fontWeight: '700', 
      color: '#1f2937', 
      textAlign: 'center', 
      marginBottom: '32px' 
    },
    
    answerSection: { 
      maxWidth: '300px', 
      margin: '0 auto 32px' 
    },
    answerLabel: { 
      fontSize: '14px', 
      fontWeight: '600', 
      color: '#374151', 
      marginBottom: '8px', 
      display: 'block' 
    },
    answerInput: { 
      width: '100%', 
      padding: '16px', 
      fontSize: '24px', 
      fontWeight: '600', 
      textAlign: 'center', 
      border: '3px solid #e5e7eb', 
      borderRadius: '12px', 
      transition: 'all 0.3s' 
    },
    
    choiceButton: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '8px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      background: 'white',
      transition: 'all 0.2s',
      fontSize: '16px',
      fontWeight: '500',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    choiceButtonSelected: {
      background: '#f0f9ff',
      borderColor: '#3b82f6'
    },
    
    navigationButtons: { 
      display: 'flex', 
      gap: '12px', 
      justifyContent: 'center' 
    },
    navButton: { 
      padding: '12px 24px', 
      background: '#6b7280', 
      color: 'white', 
      border: 'none', 
      borderRadius: '8px', 
      fontSize: '15px', 
      fontWeight: '600', 
      cursor: 'pointer', 
      transition: 'all 0.3s' 
    },
    navButtonDisabled: { 
      opacity: 0.5, 
      cursor: 'not-allowed' 
    },
    
    allQuestionsCard: { 
      background: 'white', 
      borderRadius: '16px', 
      padding: '24px', 
      marginBottom: '24px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
    },
    sectionTitle: { 
      fontSize: '18px', 
      fontWeight: '700', 
      color: '#1f2937', 
      marginBottom: '16px' 
    },
    questionsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(5, 1fr)', 
      gap: '12px', 
      marginBottom: '24px' 
    },
    questionBox: { 
      padding: '12px', 
      textAlign: 'center', 
      borderRadius: '8px', 
      border: '2px solid #e5e7eb', 
      cursor: 'pointer', 
      transition: 'all 0.3s' 
    },
    questionBoxActive: { 
      borderColor: '#3b82f6', 
      background: '#f0f9ff' 
    },
    questionBoxAnswered: { 
      background: '#d1fae5', 
      borderColor: '#34d399' 
    },
    questionBoxNumber: { 
      fontSize: '16px', 
      fontWeight: '700', 
      color: '#1f2937' 
    },
    
    submitButton: { 
      width: '100%', 
      padding: '16px', 
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
      color: 'white', 
      border: 'none', 
      borderRadius: '12px', 
      fontSize: '18px', 
      fontWeight: '700', 
      cursor: 'pointer', 
      transition: 'all 0.3s' 
    },
    
    loadingContainer: { 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' 
    },
    loadingText: { 
      fontSize: '24px', 
      color: '#6b7280', 
      fontWeight: '600' 
    },
  };

  // ✅ Show loading state
  if (loadingTopics) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading topics...</div>
      </div>
    );
  }

  // ✅ Show topic selection screen
  if (showTopicSelection) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <h1 style={styles.title}>🎯 Placement Quiz - Select Topic</h1>
            </div>
            <p style={styles.subtitle}>
              Choose a topic to start your placement quiz. This will determine your starting level (1-10) for that topic.
            </p>
          </div>

          {error && (
            <div style={error.includes('✅') || error.includes('⏳') ? styles.successMessage : styles.errorMessage}>
              {error}
            </div>
          )}

          {topics.availableTopics && topics.availableTopics.length > 0 && (
            <div style={styles.allQuestionsCard}>
              <h2 style={styles.sectionTitle}>Available Topics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {topics.availableTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    style={{
                      padding: '24px',
                      background: 'white',
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f0f9ff';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    📚 {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {topics.completedTopics && topics.completedTopics.length > 0 && (
            <div style={styles.allQuestionsCard}>
              <h2 style={styles.sectionTitle}>✅ Completed Topics</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {topics.completedTopics.map((topic) => (
                  <div
                    key={topic}
                    style={{
                      padding: '12px 20px',
                      background: '#d1fae5',
                      border: '2px solid #34d399',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#065f46'
                    }}
                  >
                    ✓ {topic}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/student')}
            style={{
              ...styles.navButton,
              width: '200px',
              margin: '0 auto',
              display: 'block'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ✅ Show loading while generating quiz
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading quiz for {selectedTopic}...</div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={error.includes('✅') ? styles.successMessage : styles.errorMessage}>
            {error || '⚠️ Failed to load quiz'}
          </div>
          <button
            onClick={() => {
              setShowTopicSelection(true);
              setSelectedTopic('');
              setError('');
            }}
            style={{
              ...styles.navButton,
              width: '200px',
              margin: '16px auto 0',
              display: 'block'
            }}
          >
            ← Back to Topics
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / quizData.total_questions) * 100;
  const answeredCount = answers.filter(a => a !== '').length;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>🎯 Placement Quiz - {selectedTopic || quizData.topic}</h1>
            <div style={styles.badge}>Quiz Level 1</div>
          </div>
          <p style={styles.subtitle}>
            This quiz will determine your starting level (1-10) for {selectedTopic || quizData.topic}. Take your time and do your best!
          </p>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        {/* Current Question */}
        <div style={styles.quizCard}>
          <div style={styles.questionHeader}>
            <span style={styles.questionNumber}>
              Question {currentQuestion + 1} of {quizData.total_questions}
            </span>
            <span style={styles.operationBadge}>
              {quizData.questions[currentQuestion].operation.toUpperCase()}
            </span>
          </div>

          <div style={styles.questionText}>
            {quizData.questions[currentQuestion].question_text}
          </div>

          <div style={styles.answerSection}>
            {quizData.questions[currentQuestion].choices && quizData.questions[currentQuestion].choices.length > 0 ? (
              // Multiple choice question
              <div>
                <label style={styles.answerLabel}>Select Your Answer:</label>
                {quizData.questions[currentQuestion].choices.map((choice, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      ...styles.choiceButton,
                      ...(answers[currentQuestion] === choice ? styles.choiceButtonSelected : {})
                    }}
                    onClick={() => handleAnswerChange(currentQuestion, choice)}
                    onMouseEnter={(e) => {
                      if (answers[currentQuestion] !== choice) {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (answers[currentQuestion] !== choice) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      checked={answers[currentQuestion] === choice}
                      onChange={() => handleAnswerChange(currentQuestion, choice)}
                      style={{ marginRight: '8px' }}
                    />
                    <span>{choice}</span>
                  </div>
                ))}
              </div>
            ) : (
              // Text input question
              <div>
                <label style={styles.answerLabel}>Your Answer:</label>
                <input
                  type="text"
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                  placeholder="Enter your answer"
                  style={styles.answerInput}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  autoFocus
                />
              </div>
            )}
          </div>

          <div style={styles.navigationButtons}>
            <button
              style={{
                ...styles.navButton,
                ...(currentQuestion === 0 ? styles.navButtonDisabled : {})
              }}
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              onMouseEnter={(e) => currentQuestion > 0 && (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => currentQuestion > 0 && (e.target.style.background = '#6b7280')}
            >
              ← Previous
            </button>
            <button
              style={{
                ...styles.navButton,
                ...(currentQuestion === quizData.total_questions - 1 ? styles.navButtonDisabled : {})
              }}
              onClick={handleNext}
              disabled={currentQuestion === quizData.total_questions - 1}
              onMouseEnter={(e) => currentQuestion < quizData.total_questions - 1 && (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => currentQuestion < quizData.total_questions - 1 && (e.target.style.background = '#6b7280')}
            >
              Next →
            </button>
          </div>
        </div>

        {/* All Questions Overview */}
        <div style={styles.allQuestionsCard}>
          <div style={styles.sectionTitle}>
            📊 Questions Overview ({answeredCount}/{quizData.total_questions} answered)
          </div>
          <div style={styles.questionsGrid}>
            {quizData.questions.map((_, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.questionBox,
                  ...(idx === currentQuestion ? styles.questionBoxActive : {}),
                  ...(answers[idx] !== '' ? styles.questionBoxAnswered : {})
                }}
                onClick={() => setCurrentQuestion(idx)}
                onMouseEnter={(e) => {
                  if (idx !== currentQuestion) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (idx !== currentQuestion) {
                    e.currentTarget.style.borderColor = answers[idx] !== '' ? '#34d399' : '#e5e7eb';
                  }
                }}
              >
                <div style={styles.questionBoxNumber}>
                  {answers[idx] !== '' ? '✓' : idx + 1}
                </div>
              </div>
            ))}
          </div>

          <button
            style={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting}
            onMouseEnter={(e) => !submitting && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !submitting && (e.target.style.transform = 'translateY(0)')}
          >
            {submitting ? '⏳ Submitting...' : `🚀 Submit Placement Quiz (${answeredCount}/${quizData.total_questions} answered)`}
          </button>
        </div>
      </div>
    </div>
  );
}