import React, { useState, useEffect } from 'react';
import './MaintenanceNoticeBanner.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

function MaintenanceNoticeBanner({ userRole }) {
  const [notices, setNotices] = useState([]);
  const [dismissedNotices, setDismissedNotices] = useState([]);

  useEffect(() => {
    fetchActiveNotices();
    loadDismissedNotices();
  }, []);

  const fetchActiveNotices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/auth/maintenance-notices`);
      const data = await response.json();

      if (data.success) {
        // Filter notices for the current user's role
        const relevantNotices = data.data.filter((notice) => {
          return (
            notice.targetRoles.includes('all') ||
            notice.targetRoles.includes(userRole)
          );
        });
        setNotices(relevantNotices);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance notices:', error);
    }
  };

  const loadDismissedNotices = () => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotices') || '[]');
    setDismissedNotices(dismissed);
  };

  const dismissNotice = (noticeId) => {
    const updated = [...dismissedNotices, noticeId];
    setDismissedNotices(updated);
    localStorage.setItem('dismissedNotices', JSON.stringify(updated));
  };

  const activeNotices = notices.filter(
    (notice) => !dismissedNotices.includes(notice._id)
  );

  if (activeNotices.length === 0) {
    return null;
  }

  return (
    <div className="maintenance-notice-container">
      {activeNotices.map((notice) => (
        <div key={notice._id} className={`maintenance-notice ${notice.type}`}>
          <div className="notice-icon">
            {notice.type === 'urgent' && '⚠️'}
            {notice.type === 'warning' && '⚡'}
            {notice.type === 'maintenance' && '🔧'}
            {notice.type === 'info' && 'ℹ️'}
          </div>
          <div className="notice-content">
            <h4>{notice.title}</h4>
            <p>{notice.message}</p>
            <small>
              Active until {new Date(notice.endDate).toLocaleString()}
            </small>
          </div>
          <button
            className="notice-dismiss"
            onClick={() => dismissNotice(notice._id)}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default MaintenanceNoticeBanner;
