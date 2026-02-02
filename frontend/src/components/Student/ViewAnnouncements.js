import React, { useState, useEffect } from 'react';

const ViewAnnouncements = () => {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, urgent, event, info

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Get user schoolId for multi-tenant filtering
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const schoolId = userData.schoolId || '';
      
      const response = await fetch(`http://localhost:5000/school-admin/announcements/public?audience=students&schoolId=${schoolId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.announcements || []);
      } else {
        setError(data.error || 'Failed to load announcements');
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : announcements.filter(ann => ann.priority === filter);

  const getPriorityStyle = (priority) => {
    switch(priority) {
      case 'urgent': return { backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444' };
      case 'event': return { backgroundColor: '#dbeafe', borderLeft: '4px solid #3b82f6' };
      case 'info': return { backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' };
      default: return { backgroundColor: '#f9fafb', borderLeft: '4px solid #9ca3af' };
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent': return '🚨';
      case 'event': return '📅';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '900px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '10px'
    },
    loading: {
      textAlign: 'center',
      padding: '60px 20px'
    },
    filterBar: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    filterBtn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    announcementCard: {
      padding: '20px',
      marginBottom: '15px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    announcementTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    announcementContent: {
      fontSize: '15px',
      color: '#475569',
      lineHeight: '1.6',
      marginBottom: '12px'
    },
    announcementMeta: {
      fontSize: '13px',
      color: '#94a3b8',
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '10px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b'
    },
    pinnedBadge: {
      backgroundColor: '#fbbf24',
      color: '#78350f',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '600'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📢 Announcements</h1>
        <p style={{ color: '#64748b' }}>Stay updated with the latest news</p>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          padding: '12px 16px', 
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div style={styles.filterBar}>
        {[
          { value: 'all', label: '📋 All', count: announcements.length },
          { value: 'urgent', label: '🚨 Urgent', count: announcements.filter(a => a.priority === 'urgent').length },
          { value: 'event', label: '📅 Events', count: announcements.filter(a => a.priority === 'event').length },
          { value: 'info', label: 'ℹ️ Info', count: announcements.filter(a => a.priority === 'info').length }
        ].map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              ...styles.filterBtn,
              backgroundColor: filter === value ? '#3b82f6' : '#f1f5f9',
              color: filter === value ? 'white' : '#64748b'
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: '48px', marginBottom: '10px' }}>📭</p>
          <p style={{ fontSize: '18px', fontWeight: '500' }}>No announcements</p>
          <p>Check back later for updates!</p>
        </div>
      ) : (
        filteredAnnouncements.map((announcement) => (
          <div 
            key={announcement._id} 
            style={{ ...styles.announcementCard, ...getPriorityStyle(announcement.priority) }}
          >
            <div style={styles.announcementTitle}>
              <span>{getPriorityIcon(announcement.priority)}</span>
              <span>{announcement.title}</span>
              {announcement.pinned && <span style={styles.pinnedBadge}>📌 Pinned</span>}
            </div>
            <div style={styles.announcementContent}>
              {announcement.content}
            </div>
            <div style={styles.announcementMeta}>
              <span>Posted: {formatDate(announcement.createdAt)}</span>
              {announcement.expiresAt && (
                <span>Expires: {formatDate(announcement.expiresAt)}</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ViewAnnouncements;
