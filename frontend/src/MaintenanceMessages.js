import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './SchoolAdmin.css';

const mockMaintenanceMessages = [
  { id: 1, title: 'Scheduled Server Maintenance', description: 'Routine server maintenance and database optimization. Users may experience brief interruptions.', scheduledDate: '2026-01-25', startTime: '02:00', endTime: '04:00', status: 'scheduled', notifyBefore: '24', createdAt: '2026-01-22' },
  { id: 2, title: 'Feature Update Deployment', description: 'Deploying new quiz features and performance improvements.', scheduledDate: '2026-02-01', startTime: '03:00', endTime: '05:00', status: 'scheduled', notifyBefore: '48', createdAt: '2026-01-20' },
  { id: 3, title: 'Database Migration', description: 'Completed database migration for improved performance.', scheduledDate: '2026-01-15', startTime: '01:00', endTime: '03:00', status: 'completed', notifyBefore: '24', createdAt: '2026-01-10' }
];

const statusConfig = {
  scheduled: { label: 'Scheduled', color: '#2563eb', bg: '#eff6ff', icon: '📅' },
  active: { label: 'In Progress', color: '#d97706', bg: '#fffbeb', icon: '🔧' },
  completed: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6', icon: '❌' }
};

const notifyOptions = [
  { value: '1', label: '1 hour before' },
  { value: '6', label: '6 hours before' },
  { value: '12', label: '12 hours before' },
  { value: '24', label: '24 hours before' },
  { value: '48', label: '48 hours before' },
  { value: '72', label: '72 hours before' }
];

export default function MaintenanceMessages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '', description: '', scheduledDate: '', startTime: '02:00', endTime: '04:00', notifyBefore: '24'
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'school-admin') { navigate('/login'); return; }
    loadMessages();
  }, [navigate]);

  const loadMessages = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages(mockMaintenanceMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormData({ title: '', description: '', scheduledDate: tomorrow.toISOString().split('T')[0], startTime: '02:00', endTime: '04:00', notifyBefore: '24' });
    setEditingId(null);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (msg) => {
    setEditingId(msg.id);
    setFormData({ title: msg.title, description: msg.description, scheduledDate: msg.scheduledDate, startTime: msg.startTime, endTime: msg.endTime, notifyBefore: msg.notifyBefore });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.scheduledDate) {
      setMessage({ type: 'error', text: 'Please fill in title and scheduled date' });
      return;
    }

    if (editingId) {
      setMessages(messages.map(m => m.id === editingId ? { ...m, ...formData } : m));
      setMessage({ type: 'success', text: 'Maintenance scheduled updated!' });
    } else {
      const newMessage = { id: Date.now(), ...formData, status: 'scheduled', createdAt: new Date().toISOString().split('T')[0] };
      setMessages([newMessage, ...messages]);
      setMessage({ type: 'success', text: 'Maintenance scheduled successfully!' });
    }

    setShowModal(false);
    resetForm();
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = () => {
    setMessages(messages.filter(m => m.id !== selectedMessage.id));
    setMessage({ type: 'success', text: 'Maintenance message deleted!' });
    setShowDeleteModal(false);
    setSelectedMessage(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const updateStatus = (msg, newStatus) => {
    setMessages(messages.map(m => m.id === msg.id ? { ...m, status: newStatus } : m));
    setMessage({ type: 'success', text: `Status updated to ${statusConfig[newStatus].label}!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getCountdown = (scheduledDate, startTime) => {
    const scheduled = new Date(`${scheduledDate}T${startTime}`);
    const now = new Date();
    const diff = scheduled - now;
    if (diff < 0) return 'Past';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  const filteredMessages = messages.filter(m => filter === 'all' || m.status === filter).sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading maintenance messages...</div></div>;
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
            <h1 className="sa-page-title">🔧 System Maintenance</h1>
            <p className="sa-page-subtitle">Schedule maintenance windows and notify all school members</p>
          </div>
          <button className="sa-button-primary" onClick={openCreateModal}>+ Schedule Maintenance</button>
        </div>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="points-tabs">
          <button className={`points-tab ${filter === 'all' ? 'points-tab-active' : ''}`} onClick={() => setFilter('all')}>All ({messages.length})</button>
          <button className={`points-tab ${filter === 'scheduled' ? 'points-tab-active' : ''}`} onClick={() => setFilter('scheduled')}>📅 Scheduled</button>
          <button className={`points-tab ${filter === 'active' ? 'points-tab-active' : ''}`} onClick={() => setFilter('active')}>🔧 In Progress</button>
          <button className={`points-tab ${filter === 'completed' ? 'points-tab-active' : ''}`} onClick={() => setFilter('completed')}>✅ Completed</button>
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No maintenance scheduled</p>
            <p style={{ color: '#9ca3af' }}>Schedule maintenance to notify users in advance</p>
          </div>
        ) : (
          <div className="sa-card">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Scheduled</th>
                  <th>Time Window</th>
                  <th>Countdown</th>
                  <th>Notify</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map(msg => {
                  const config = statusConfig[msg.status];
                  const countdown = getCountdown(msg.scheduledDate, msg.startTime);
                  return (
                    <tr key={msg.id}>
                      <td>
                        <span className="sa-badge" style={{ background: config.bg, color: config.color }}>
                          {config.icon} {config.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{msg.title}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{msg.description}</div>
                      </td>
                      <td>{msg.scheduledDate}</td>
                      <td>{msg.startTime} - {msg.endTime}</td>
                      <td>
                        {msg.status === 'scheduled' && countdown !== 'Past' ? (
                          <span style={{ background: countdown === 'Soon' ? '#fef3c7' : '#eff6ff', color: countdown === 'Soon' ? '#d97706' : '#2563eb', padding: '4px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '13px' }}>
                            {countdown}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td>{msg.notifyBefore}h before</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {msg.status === 'scheduled' && (
                            <>
                              <button className="sa-button-warning" onClick={() => updateStatus(msg, 'active')}>Start</button>
                              <button className="sa-button-action" onClick={() => openEditModal(msg)}>Edit</button>
                            </>
                          )}
                          {msg.status === 'active' && (
                            <button className="sa-button-enable" onClick={() => updateStatus(msg, 'completed')}>Complete</button>
                          )}
                          {msg.status !== 'active' && (
                            <button className="sa-button-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => { setSelectedMessage(msg); setShowDeleteModal(true); }}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="sa-modal" onClick={() => setShowModal(false)}>
          <div className="sa-modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">{editingId ? '✏️ Edit Maintenance' : '🔧 Schedule Maintenance'}</h2>
            
            <div className="sa-form-group">
              <label className="sa-label">Title *</label>
              <input type="text" className="sa-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Scheduled Server Maintenance" />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Description</label>
              <textarea className="sa-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the maintenance..." style={{ minHeight: '80px' }} />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Scheduled Date *</label>
              <input type="date" className="sa-input" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="sa-form-group">
                <label className="sa-label">Start Time</label>
                <input type="time" className="sa-input" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
              </div>
              <div className="sa-form-group">
                <label className="sa-label">End Time</label>
                <input type="time" className="sa-input" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
              </div>
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Notify Users</label>
              <select className="sa-select" value={formData.notifyBefore} onChange={(e) => setFormData({ ...formData, notifyBefore: e.target.value })}>
                {notifyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleSave}>{editingId ? 'Save Changes' : 'Schedule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMessage && (
        <div className="sa-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">🗑️ Delete Maintenance</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>"{selectedMessage.title}"</strong>?
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
