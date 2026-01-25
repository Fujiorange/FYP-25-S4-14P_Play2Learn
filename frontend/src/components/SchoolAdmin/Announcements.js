import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './SchoolAdmin.css';

const mockAnnouncements = [
  { id: 1, title: 'Welcome to Term 2!', content: 'We hope everyone had a great break. Term 2 starts with exciting new math topics including addition and subtraction with numbers up to 100!', priority: 'info', audience: 'all', pinned: true, createdAt: '2026-01-20', expiresAt: '2026-02-20', author: 'School Admin' },
  { id: 2, title: 'System Maintenance Notice', content: 'Play2Learn will be under maintenance on Saturday 25th Jan from 2am-4am SGT. Please save your work before this time.', priority: 'urgent', audience: 'all', pinned: true, createdAt: '2026-01-22', expiresAt: '2026-01-26', author: 'School Admin' },
  { id: 3, title: 'Math Competition Registration Open', content: 'Register your students for the upcoming Primary 1 Math Challenge! Great prizes to be won. Deadline: 31st Jan.', priority: 'event', audience: 'teachers', pinned: false, createdAt: '2026-01-18', expiresAt: '2026-01-31', author: 'School Admin' },
  { id: 4, title: 'New Badges Available!', content: 'Check out the new achievement badges you can earn this term: Speed Demon, Helping Hand, and Early Bird!', priority: 'info', audience: 'students', pinned: false, createdAt: '2026-01-15', expiresAt: '2026-03-15', author: 'School Admin' }
];

const priorityConfig = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', icon: '🚨' },
  event: { label: 'Event', color: '#7c3aed', bg: '#f5f3ff', icon: '📅' },
  info: { label: 'Info', color: '#2563eb', bg: '#eff6ff', icon: 'ℹ️' }
};

const audienceOptions = [
  { value: 'all', label: '👥 Everyone' },
  { value: 'students', label: '🎓 Students Only' },
  { value: 'teachers', label: '👨‍🏫 Teachers Only' },
  { value: 'parents', label: '👨‍👩‍👧 Parents Only' }
];

export default function Announcements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '', content: '', priority: 'info', audience: 'all', pinned: false, expiresAt: ''
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'school-admin') { navigate('/login'); return; }
    loadAnnouncements();
  }, [navigate]);

  const loadAnnouncements = async () => {
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnnouncements(mockAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setFormData({ 
      title: '', content: '', priority: 'info', audience: 'all', pinned: false, 
      expiresAt: nextWeek.toISOString().split('T')[0] 
    });
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      audience: announcement.audience,
      pinned: announcement.pinned,
      expiresAt: announcement.expiresAt
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      setMessage({ type: 'error', text: 'Please fill in title and content' });
      return;
    }

    if (editingId) {
      setAnnouncements(announcements.map(a => 
        a.id === editingId ? { ...a, ...formData } : a
      ));
      setMessage({ type: 'success', text: 'Announcement updated successfully!' });
    } else {
      const newAnnouncement = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
        author: 'School Admin'
      };
      setAnnouncements([newAnnouncement, ...announcements]);
      setMessage({ type: 'success', text: 'Announcement created successfully!' });
    }

    setShowModal(false);
    resetForm();
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = () => {
    setAnnouncements(announcements.filter(a => a.id !== selectedAnnouncement.id));
    setMessage({ type: 'success', text: 'Announcement deleted successfully!' });
    setShowDeleteModal(false);
    setSelectedAnnouncement(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const togglePin = (announcement) => {
    setAnnouncements(announcements.map(a => 
      a.id === announcement.id ? { ...a, pinned: !a.pinned } : a
    ));
    setMessage({ type: 'success', text: `Announcement ${announcement.pinned ? 'unpinned' : 'pinned'}!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filteredAnnouncements = announcements
    .filter(a => filter === 'all' || a.priority === filter)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const getAudienceLabel = (value) => audienceOptions.find(a => a.value === value)?.label || value;

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading announcements...</div></div>;
  }

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-secondary" onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        </div>
      </header>

      <main className="sa-main-wide">
        <div className="badge-page-header">
          <div>
            <h1 className="sa-page-title">📢 Announcements</h1>
            <p className="sa-page-subtitle">Create and manage school-wide announcements</p>
          </div>
          <button className="sa-button-primary" onClick={openCreateModal}>+ New Announcement</button>
        </div>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="points-tabs">
          <button className={`points-tab ${filter === 'all' ? 'points-tab-active' : ''}`} onClick={() => setFilter('all')}>All ({announcements.length})</button>
          <button className={`points-tab ${filter === 'urgent' ? 'points-tab-active' : ''}`} onClick={() => setFilter('urgent')}>🚨 Urgent</button>
          <button className={`points-tab ${filter === 'event' ? 'points-tab-active' : ''}`} onClick={() => setFilter('event')}>📅 Events</button>
          <button className={`points-tab ${filter === 'info' ? 'points-tab-active' : ''}`} onClick={() => setFilter('info')}>ℹ️ Info</button>
        </div>

        {/* Announcements List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📢</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No announcements yet</p>
            <p style={{ color: '#9ca3af' }}>Create your first announcement to notify users</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredAnnouncements.map(announcement => {
              const config = priorityConfig[announcement.priority];
              return (
                <div key={announcement.id} className="sa-card" style={{ borderLeft: `4px solid ${config.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {announcement.pinned && <span title="Pinned">📌</span>}
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{announcement.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="sa-badge" style={{ background: config.bg, color: config.color }}>
                        {config.icon} {config.label}
                      </span>
                      <span className="sa-badge sa-badge-primary">{getAudienceLabel(announcement.audience)}</span>
                    </div>
                  </div>
                  
                  <p style={{ color: '#4b5563', marginBottom: '16px', lineHeight: '1.6' }}>{announcement.content}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Created: {announcement.createdAt} • Expires: {announcement.expiresAt} • By: {announcement.author}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="sa-button-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => togglePin(announcement)}>
                        {announcement.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button className="sa-button-action" onClick={() => openEditModal(announcement)}>Edit</button>
                      <button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => { setSelectedAnnouncement(announcement); setShowDeleteModal(true); }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="sa-modal" onClick={() => setShowModal(false)}>
          <div className="sa-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">{editingId ? '✏️ Edit Announcement' : '📢 New Announcement'}</h2>
            
            <div className="sa-form-group">
              <label className="sa-label">Title *</label>
              <input type="text" className="sa-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Important Notice" />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Content *</label>
              <textarea className="sa-textarea" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Write your announcement here..." style={{ minHeight: '120px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="sa-form-group">
                <label className="sa-label">Priority</label>
                <select className="sa-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="info">ℹ️ Info</option>
                  <option value="event">📅 Event</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div className="sa-form-group">
                <label className="sa-label">Audience</label>
                <select className="sa-select" value={formData.audience} onChange={(e) => setFormData({ ...formData, audience: e.target.value })}>
                  {audienceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="sa-form-group">
                <label className="sa-label">Expires On</label>
                <input type="date" className="sa-input" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
              </div>

              <div className="sa-form-group">
                <label className="sa-label">Pin to Top</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <div className={`toggle-switch ${formData.pinned ? 'toggle-active' : ''}`} onClick={() => setFormData({ ...formData, pinned: !formData.pinned })}>
                    <div className="toggle-knob"></div>
                  </div>
                  <span style={{ color: '#6b7280' }}>{formData.pinned ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleSave}>{editingId ? 'Save Changes' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAnnouncement && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Delete Announcement</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{selectedAnnouncement.title}"</strong>?<br /><br />
              This action cannot be undone.
            </p>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="sa-modal-button-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
