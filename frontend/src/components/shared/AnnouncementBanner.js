import React, { useState, useEffect } from 'react';

// This component can be imported into any dashboard (Student, Teacher, Parent)
// Usage: <AnnouncementBanner userRole="student" />

const priorityConfig = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🚨' },
  event: { label: 'Event', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '📅' },
  info: { label: 'Info', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ️' }
};

export default function AnnouncementBanner({ userRole = 'all' }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadAnnouncements();
    // Load dismissed announcements from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setDismissedIds(dismissed);
  }, [userRole]);

  const loadAnnouncements = async () => {
    try {
      // TODO: Replace with real API call
      // const result = await fetch(`/api/announcements?audience=${userRole}`);
      // const data = await result.json();
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockAnnouncements = [
        { 
          id: 1, 
          title: 'System Maintenance Notice', 
          content: 'Play2Learn will be under maintenance on Saturday 25th Jan from 2am-4am SGT. Please save your work before this time.', 
          priority: 'urgent', 
          audience: 'all', 
          pinned: true, 
          createdAt: '2026-01-22',
          expiresAt: '2026-01-26'
        },
        { 
          id: 2, 
          title: 'Welcome to Term 2!', 
          content: 'We hope everyone had a great break. Term 2 starts with exciting new math topics including addition and subtraction with numbers up to 100!', 
          priority: 'info', 
          audience: 'all', 
          pinned: true, 
          createdAt: '2026-01-20',
          expiresAt: '2026-02-20'
        },
        { 
          id: 3, 
          title: 'New Badges Available!', 
          content: 'Check out the new achievement badges you can earn this term: Speed Demon, Helping Hand, and Early Bird!', 
          priority: 'event', 
          audience: 'students', 
          pinned: false, 
          createdAt: '2026-01-18',
          expiresAt: '2026-03-15'
        }
      ];

      // Filter by audience (all, or specific role)
      const filtered = mockAnnouncements.filter(a => 
        a.audience === 'all' || a.audience === userRole || a.audience === `${userRole}s`
      );

      // Filter out expired announcements
      const now = new Date();
      const valid = filtered.filter(a => new Date(a.expiresAt) > now);

      // Sort: pinned first, then by priority (urgent > event > info), then by date
      const priorityOrder = { urgent: 0, event: 1, info: 2 };
      valid.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setAnnouncements(valid);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAnnouncement = (id) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  const styles = {
    container: {
      marginBottom: '24px'
    },
    announcement: (priority) => ({
      background: priorityConfig[priority].bg,
      border: `2px solid ${priorityConfig[priority].border}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '12px',
      position: 'relative'
    }),
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '12px'
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1
    },
    icon: {
      fontSize: '20px'
    },
    title: (priority) => ({
      margin: 0,
      fontSize: '16px',
      fontWeight: '600',
      color: priorityConfig[priority].color
    }),
    badge: (priority) => ({
      fontSize: '11px',
      padding: '2px 8px',
      borderRadius: '4px',
      background: priorityConfig[priority].color,
      color: 'white',
      fontWeight: '600'
    }),
    pinBadge: {
      fontSize: '12px'
    },
    content: {
      margin: '8px 0 0 28px',
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5'
    },
    contentCollapsed: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '90%'
    },
    meta: {
      margin: '8px 0 0 28px',
      fontSize: '12px',
      color: '#6b7280'
    },
    dismissBtn: {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      color: '#9ca3af',
      padding: '0',
      lineHeight: 1
    },
    expandBtn: {
      background: 'none',
      border: 'none',
      color: '#2563eb',
      cursor: 'pointer',
      fontSize: '13px',
      padding: '0',
      marginLeft: '28px',
      marginTop: '4px'
    }
  };

  return (
    <div style={styles.container}>
      {visibleAnnouncements.map(announcement => {
        const config = priorityConfig[announcement.priority];
        const isExpanded = expandedId === announcement.id;
        const isLongContent = announcement.content.length > 100;

        return (
          <div key={announcement.id} style={styles.announcement(announcement.priority)}>
            <div style={styles.header}>
              <div style={styles.titleRow}>
                <span style={styles.icon}>{config.icon}</span>
                <h4 style={styles.title(announcement.priority)}>{announcement.title}</h4>
                {announcement.pinned && <span style={styles.pinBadge}>📌</span>}
                <span style={styles.badge(announcement.priority)}>{config.label}</span>
              </div>
              {!announcement.pinned && (
                <button 
                  style={styles.dismissBtn} 
                  onClick={() => dismissAnnouncement(announcement.id)}
                  title="Dismiss"
                >
                  ×
                </button>
              )}
            </div>
            <p style={{
              ...styles.content,
              ...(isLongContent && !isExpanded ? styles.contentCollapsed : {})
            }}>
              {announcement.content}
            </p>
            {isLongContent && (
              <button 
                style={styles.expandBtn}
                onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
              >
                {isExpanded ? 'Show less' : 'Read more...'}
              </button>
            )}
            <div style={styles.meta}>
              Posted: {announcement.createdAt}
            </div>
          </div>
        );
      })}
    </div>
  );
}
