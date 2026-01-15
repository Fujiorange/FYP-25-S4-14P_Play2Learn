import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

export default function ManualAddUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    gender: '',
    gradeLevel: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (formData.role === 'student' && !formData.gradeLevel) {
      setMessage({ type: 'error', text: 'Please select a grade level for students' });
      return;
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:5001/api/school-admin/users/create', {...});
      
      setMessage({ type: 'success', text: 'User created successfully!' });
      setTimeout(() => {
        setFormData({ name: '', email: '', password: '', role: '', gender: '', gradeLevel: '' });
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create user' });
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
          <button className="sa-button-small" onClick={() => navigate('/school-admin')}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="sa-main">
        <h1 className="sa-page-title">Add New User</h1>
        <p className="sa-page-subtitle">Create a new user account manually.</p>

        <div className="sa-card">
          {message.text && (
            <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="sa-form-group">
              <label className="sa-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="sa-input"
              />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="sa-input"
              />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="sa-input"
              />
            </div>

            <div className="sa-form-group">
              <label className="sa-label">Role *</label>
              <select name="role" value={formData.role} onChange={handleChange} className="sa-select">
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="school-admin">School Admin</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <div className="sa-form-group">
                <label className="sa-label">Grade Level *</label>
                <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} className="sa-select">
                  <option value="">Select grade</option>
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="Primary 6">Primary 6</option>
                </select>
              </div>
            )}

            <div className="sa-form-group">
              <label className="sa-label">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="sa-select">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="sa-button-primary">Create User</button>
          </form>
        </div>
      </main>
    </div>
  );
}