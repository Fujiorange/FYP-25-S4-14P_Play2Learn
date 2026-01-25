// frontend/src/pages/Parent/ViewFeedback.js - COMPLETE VERSION
// ✅ Loads real feedback from database
// ✅ No more mock data

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import parentService from '../../services/parentService';

export default function ViewFeedback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // ✅ FIXED: Load real feedback from database
        const result = await parentService.getFeedback();
        
        if (result.success) {
          setFeedback(result.feedback || []);
          setError(null);
        } else {
          console.error('Failed to load feedback:', result.error);
          setError(result.error || 'Failed to load feedback');
          setFeedback([]);
        }
      } catch (error) {
        console.error('Error loading feedback:', error);
        setError('Failed to load feedback. Please try again.');
        setFeedback([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [navigate]);

  const handleMarkAsRead = async (feedbackId) => {
    try {
      const result = await parentService.markFeedbackAsRead(feedbackId);
      
      if (result.success) {
        // Update local state
        setFeedback(prev => prev.map(f => 
          f.id === feedbackId ? { ...f, isRead: true } : f
        ));
      }
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : filter === 'unread' 
    ? feedback.filter(f => !f.isRead)
    : feedback.filter(f => f.sentiment === filter);

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return { bg: '#d1fae5', color: '#065f46', emoji: '😊' };
      case 'neutral': return { bg: '#dbeafe', color: '#1e40af', emoji: '😐' };
      case 'concern': return { bg: '#fef3c7', color: '#92400e', emoji: '😟' };
      default: return { bg: '#f3f4f6', color: '#6b7280', emoji: '😐' };
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'academic': return { bg: '#dbeafe', color: '#1e40af' };
      case 'behavior': return { bg: '#fef3c7', color: '#92400e' };
      case 'attendance': return { bg: '#fee2e2', color: '#991b1b' };
      case 'general': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filterButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    filterButton: { padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', background: 'white', transition: 'all 0.2s' },
    filterButtonActive: { borderColor: '#10b981', background: '#d1fae5', color: '#065f46' },
    feedbackList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    feedbackCard: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', position: 'relative' },
    feedbackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' },
    feedbackMeta: { flex: 1 },
    childName: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' },
    teacherInfo: { fontSize: '14px', color: '#6b7280', marginBottom: '8px' },
    badges: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    badge: { padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    feedbackMessage: { fontSize: '15px', color: '#374151', lineHeight: '1.6', marginTop: '16px', padding: '16px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #10b981' },
    unreadDot: { position: 'absolute', top: '20px', right: '20px', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', color: '#6b7280' },
    errorMessage: { background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #f87171' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    markReadButton: { padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' },
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>💬 Teacher Feedback</h1>
            <button style={styles.backButton} onClick={() => navigate('/parent')}>← Back to Dashboard</button>
          </div>
          <div style={styles.filterButtons}>
            {['all', 'unread', 'positive', 'neutral', 'concern'].map(filterOption => (
              <button 
                key={filterOption} 
                onClick={() => setFilter(filterOption)} 
                style={{
                  ...styles.filterButton, 
                  ...(filter === filterOption ? styles.filterButtonActive : {})
                }}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {filteredFeedback.length > 0 ? (
          <div style={styles.feedbackList}>
            {filteredFeedback.map(item => {
              const sentimentStyle = getSentimentColor(item.sentiment);
              const categoryStyle = getCategoryColor(item.category);
              
              return (
                <div 
                  key={item.id} 
                  style={styles.feedbackCard}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                >
                  {!item.isRead && <div style={styles.unreadDot} title="Unread" />}
                  
                  <div style={styles.feedbackHeader}>
                    <div style={styles.feedbackMeta}>
                      <div style={styles.childName}>
                        👦 {item.child?.name || 'Child'} • {item.child?.class || 'N/A'}
                      </div>
                      <div style={styles.teacherInfo}>
                        From: <strong>{item.from}</strong> • Subject: <strong>{item.subject}</strong> • {parentService.formatDate(item.date)}
                      </div>
                      <div style={styles.badges}>
                        <span style={{...styles.badge, background: sentimentStyle.bg, color: sentimentStyle.color}}>
                          {sentimentStyle.emoji} {item.sentiment}
                        </span>
                        <span style={{...styles.badge, background: categoryStyle.bg, color: categoryStyle.color}}>
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.feedbackMessage}>
                    {item.message}
                  </div>

                  {!item.isRead && (
                    <button 
                      style={styles.markReadButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                    >
                      ✓ Mark as Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {filter === 'all' ? 'No feedback yet' : `No ${filter} feedback`}
            </p>
            <p>
              {feedback.length === 0 
                ? "You haven't received any feedback from teachers yet"
                : `No ${filter} feedback to show`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}