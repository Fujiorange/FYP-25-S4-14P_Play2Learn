import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getMaintenanceNotices,
  createMaintenanceNotice,
  updateMaintenanceNotice,
  deleteMaintenanceNotice,
} from '../../services/p2lAdminService';
import './MaintenanceNoticeManager.css';

function MaintenanceNoticeManager() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    startDate: '',
    endDate: '',
    targetRoles: ['all'],
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await getMaintenanceNotices();
      setNotices(response.data || []);
    } catch (error) {
      console.error('Failed to fetch maintenance notices:', error);
      alert('Failed to load maintenance notices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (role) => {
    if (role === 'all') {
      setFormData({ ...formData, targetRoles: ['all'] });
    } else {
      const currentRoles = formData.targetRoles.filter(r => r !== 'all');
      if (currentRoles.includes(role)) {
        const newRoles = currentRoles.filter(r => r !== role);
        setFormData({ ...formData, targetRoles: newRoles.length > 0 ? newRoles : ['all'] });
      } else {
        setFormData({ ...formData, targetRoles: [...currentRoles, role] });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingNotice) {
        await updateMaintenanceNotice(editingNotice._id, formData);
      } else {
        await createMaintenanceNotice(formData);
      }

      setShowForm(false);
      setEditingNotice(null);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Failed to save maintenance notice:', error);
      alert(error.message || 'Failed to save maintenance notice');
    }
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      message: notice.message,
      type: notice.type,
      startDate: new Date(notice.startDate).toISOString().slice(0, 16),
      endDate: new Date(notice.endDate).toISOString().slice(0, 16),
      targetRoles: notice.targetRoles,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    try {
      await deleteMaintenanceNotice(id);
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
      alert('Failed to delete notice');
    }
  };

  const toggleActive = async (notice) => {
    try {
      await updateMaintenanceNotice(notice._id, {
        ...notice,
        isActive: !notice.isActive,
      });
      fetchNotices();
    } catch (error) {
      console.error('Failed to update notice status:', error);
      alert('Failed to update notice status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      startDate: '',
      endDate: '',
      targetRoles: ['all'],
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingNotice(null);
    resetForm();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="maintenance-notice-manager">
      <header className="page-header">
        <div>
          <h1>System Maintenance Notices</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Create Notice
        </button>
      </header>

      <div className="notices-list">
        {notices.length === 0 ? (
          <p className="no-data">No maintenance notices found.</p>
        ) : (
          <div className="notices-grid">
            {notices.map((notice) => (
              <div
                key={notice._id}
                className={`notice-card ${notice.type} ${!notice.isActive ? 'inactive' : ''}`}
              >
                <div className="notice-header">
                  <h3>{notice.title}</h3>
                  <span className={`badge badge-${notice.type}`}>{notice.type}</span>
                </div>
                <p className="notice-message">{notice.message}</p>
                <div className="notice-meta">
                  <p>
                    <strong>Start:</strong>{' '}
                    {new Date(notice.startDate).toLocaleString()}
                  </p>
                  <p>
                    <strong>End:</strong> {new Date(notice.endDate).toLocaleString()}
                  </p>
                  <p>
                    <strong>Target:</strong>{' '}
                    {notice.targetRoles.join(', ')}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={notice.isActive ? 'status-active' : 'status-inactive'}>
                      {notice.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </p>
                </div>
                <div className="notice-actions">
                  <button onClick={() => handleEdit(notice)} className="btn-edit">
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(notice)}
                    className="btn-toggle"
                  >
                    {notice.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(notice._id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingNotice ? 'Edit' : 'Create'} Maintenance Notice</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Target Roles *</label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes('all')}
                      onChange={() => handleRoleChange('all')}
                    />
                    All Users
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes('School Admin')}
                      onChange={() => handleRoleChange('School Admin')}
                      disabled={formData.targetRoles.includes('all')}
                    />
                    School Admins
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes('Teacher')}
                      onChange={() => handleRoleChange('Teacher')}
                      disabled={formData.targetRoles.includes('all')}
                    />
                    Teachers
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes('Student')}
                      onChange={() => handleRoleChange('Student')}
                      disabled={formData.targetRoles.includes('all')}
                    />
                    Students
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes('Parent')}
                      onChange={() => handleRoleChange('Parent')}
                      disabled={formData.targetRoles.includes('all')}
                    />
                    Parents
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingNotice ? 'Update' : 'Create'} Notice
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceNoticeManager;
