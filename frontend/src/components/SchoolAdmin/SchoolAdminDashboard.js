import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

export default function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    // TODO: Replace with actual auth check
    setUser({ name: 'School Admin', email: 'admin@school.com' });
    setDashboardData({
      total_students: 45,
      total_classes: 3,
      total_teachers: 8,
    });
  }, [navigate]);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  if (!user) {
    return (
      <div className="sa-loading">
        <div className="sa-loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <div className="sa-header-right">
            <div className="sa-user-info">
              <p className="sa-user-name">{user.name}</p>
              <p className="sa-user-role">School Admin</p>
            </div>
            <button className="sa-button-danger" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="sa-main-wide">
        <div className="sa-welcome-section">
          <h1 className="sa-welcome-title">Welcome back, {user.name?.split(' ')[0]}! 👋</h1>
          <p className="sa-welcome-subtitle">Manage your school's adaptive learning platform.</p>
        </div>

        <div className="sa-stats-grid">
          <div className="sa-stat-card">
            <div className="sa-stat-icon">🎓</div>
            <p className="sa-stat-label">Total Students</p>
            <p className="sa-stat-value">{dashboardData?.total_students || 0}</p>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-icon">📚</div>
            <p className="sa-stat-label">Total Classes</p>
            <p className="sa-stat-value">{dashboardData?.total_classes || 0}</p>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-icon">👨‍🏫</div>
            <p className="sa-stat-label">Total Teachers</p>
            <p className="sa-stat-value">{dashboardData?.total_teachers || 0}</p>
          </div>
        </div>

        <div className="sa-sections-grid">
          {/* Account Management */}
          <div className="sa-section">
            <div className="sa-section-header">
              <span className="sa-section-icon">📝</span>
              <h2 className="sa-section-title">Account Management</h2>
            </div>
            <ul className="sa-menu-list">
              <li className={`sa-menu-item ${hoveredItem === 'manual-add' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('manual-add')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleMenuClick('/school-admin/users/manual-add')}>
                <span>Add User (Single)</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className={`sa-menu-item ${hoveredItem === 'bulk-upload' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('bulk-upload')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleMenuClick('/school-admin/users/bulk-upload')}>
                <span>Upload CSV (Bulk)</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className={`sa-menu-item ${hoveredItem === 'remove-user' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('remove-user')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleMenuClick('/school-admin/users/remove')}>
                <span>Remove User</span>
                <span className="sa-menu-arrow">→</span>
              </li>
            </ul>
          </div>

          {/* User Management */}
          <div className="sa-section">
            <div className="sa-section-header">
              <span className="sa-section-icon">👥</span>
              <h2 className="sa-section-title">User Management</h2>
            </div>
            <ul className="sa-menu-list">
              <li className={`sa-menu-item ${hoveredItem === 'permissions' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('permissions')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleMenuClick('/school-admin/users/permissions')}>
                <span>Manage Permissions</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className={`sa-menu-item ${hoveredItem === 'reset-password' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('reset-password')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleMenuClick('/school-admin/users/reset-password')}>
                <span>Reset Password</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className={`sa-menu-item ${hoveredItem === 'disable-user' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('disable-user')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleMenuClick('/school-admin/users/disable')}>
                <span>Disable User</span>
                <span className="sa-menu-arrow">→</span>
              </li>
            </ul>
          </div>

          {/* Class Management */}
          <div className="sa-section">
            <div className="sa-section-header">
              <span className="sa-section-icon">🏫</span>
              <h2 className="sa-section-title">Class Management</h2>
            </div>
            <ul className="sa-menu-list">
              <li className={`sa-menu-item ${hoveredItem === 'manage-classes' ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredItem('manage-classes')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleMenuClick('/school-admin/classes/manage')}>
                <span>Manage Classes</span>
                <span className="sa-menu-arrow">→</span>
              </li>
            </ul>
          </div>

          {/* Incentive System */}
          <div className="sa-section">
            <div className="sa-section-header">
              <span className="sa-section-icon">🏆</span>
              <h2 className="sa-section-title">Incentive System</h2>
            </div>
            <ul className="sa-menu-list">
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/incentive/badges')}>
                <span>Badge Management</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/incentive/points')}>
                <span>Point Management</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/incentive/redemption')}>
                <span>Redemption System</span>
                <span className="sa-menu-arrow">→</span>
              </li>
            </ul>
          </div>

          {/* Support System */}
          <div className="sa-section">
            <div className="sa-section-header">
              <span className="sa-section-icon">🎫</span>
              <h2 className="sa-section-title">Support System</h2>
            </div>
            <ul className="sa-menu-list">
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/support/tickets')}>
                <span>Support Tickets</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/support/knowledge-base')}>
                <span>Knowledge Base</span>
                <span className="sa-menu-arrow">→</span>
              </li>
            </ul>
          </div>

          {/* Analytics Panel */}
          <div className="sa-section">
            <div className="sa-section-header">
              <span className="sa-section-icon">📊</span>
              <h2 className="sa-section-title">Analytics Panel</h2>
            </div>
            <ul className="sa-menu-list">
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/analytics/trends')}>
                <span>Trend Monitoring</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/analytics/performance')}>
                <span>Performance Dashboard</span>
                <span className="sa-menu-arrow">→</span>
              </li>
            </ul>
          </div>

          {/* Communication */}
          <div className="sa-section">
            <div className="sa-section-header">
              <span className="sa-section-icon">📢</span>
              <h2 className="sa-section-title">Communication</h2>
            </div>
            <ul className="sa-menu-list">
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/communication/announcements')}>
                <span>School Announcements</span>
                <span className="sa-menu-arrow">→</span>
              </li>
              <li className="sa-menu-item" onClick={() => handleMenuClick('/school-admin/communication/maintenance')}>
                <span>Maintenance Messages</span>
                <span className="sa-menu-arrow">→</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}