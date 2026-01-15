import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

const mockClasses = [
  { _id: '1', name: "Primary 1A", subject: "Mathematics", teacher: "Ms. Wong", students: 25 },
  { _id: '2', name: "Primary 2B", subject: "English", teacher: "Mr. Tan", students: 28 },
];

export default function ManageClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({ name: '', subject: '', teacher: '', students: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setClasses(mockClasses);
  }, []);

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingClass(null);
    setFormData({ name: '', subject: '', teacher: '', students: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData(cls);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject) {
      setMessage({ type: 'error', text: 'Please fill in required fields' });
      return;
    }

    try {
      // TODO: API call
      if (editingClass) {
        setClasses(classes.map(c => c._id === editingClass._id ? { ...c, ...formData } : c));
        setMessage({ type: 'success', text: 'Class updated successfully' });
      } else {
        setClasses([...classes, { _id: Date.now().toString(), ...formData, students: parseInt(formData.students) || 0 }]);
        setMessage({ type: 'success', text: 'Class created successfully' });
      }
      setIsModalOpen(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save class' });
    }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete class "${cls.name}"?`)) return;

    try {
      // TODO: API call
      setClasses(classes.filter(c => c._id !== cls._id));
      setMessage({ type: 'success', text: 'Class deleted successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete class' });
    }
  };

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-small" onClick={() => navigate('/school-admin')}>← Back</button>
        </div>
      </header>

      <main className="sa-main">
        <h1 className="sa-page-title">Manage Classes</h1>
        <p className="sa-page-subtitle">Create, edit, and manage classes.</p>

        <div className="sa-card">
          {message.text && (
            <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div className="sa-flex" style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sa-search-input"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button className="sa-button-primary" onClick={handleAdd}>+ Add Class</button>
          </div>

          <table className="sa-table">
            <thead>
              <tr><th>Class Name</th><th>Subject</th><th>Teacher</th><th>Students</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredClasses.map((cls) => (
                <tr key={cls._id}>
                  <td><strong>{cls.name}</strong></td>
                  <td>{cls.subject}</td>
                  <td>{cls.teacher}</td>
                  <td>{cls.students}</td>
                  <td>
                    <button className="sa-button-action" onClick={() => handleEdit(cls)} style={{ marginRight: '8px' }}>Edit</button>
                    <button className="sa-button-danger" onClick={() => handleDelete(cls)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClasses.length === 0 && <div className="sa-table-empty">No classes found</div>}
        </div>
      </main>

      {isModalOpen && (
        <div className="sa-modal" onClick={() => setIsModalOpen(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">{editingClass ? 'Edit Class' : 'Add New Class'}</h2>
            <div className="sa-form-group">
              <label className="sa-label">Class Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="sa-input" />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Subject *</label>
              <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="sa-input" />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Teacher</label>
              <input type="text" value={formData.teacher} onChange={(e) => setFormData({...formData, teacher: e.target.value})} className="sa-input" />
            </div>
            <div className="sa-form-group">
              <label className="sa-label">Number of Students</label>
              <input type="number" value={formData.students} onChange={(e) => setFormData({...formData, students: e.target.value})} className="sa-input" />
            </div>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}