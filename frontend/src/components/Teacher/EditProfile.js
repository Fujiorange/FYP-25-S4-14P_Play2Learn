import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    gender: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      
      if (data.success && data.user) {
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          contact: data.user.contact || '',
          gender: data.user.gender || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const user = authService.getCurrentUser();
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          contact: user.contact || '',
          gender: user.gender || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          gender: formData.gender,
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => navigate('/teacher/profile'), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '600px', margin: '0 auto' },
    card: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    title: { fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginBottom: '24px' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' },
    inputDisabled: { background: '#f3f4f6', color: '#6b7280' },
    select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', background: 'white' },
    submitBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
    submitBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    messageBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
    hint: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  };

  if (loading) {
    return <div style={styles.container}><div style={styles.content}><div style={styles.card}><p>Loading...</p></div></div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher/profile')}>← Back to Profile</button>

        <div style={styles.card}>
          <h1 style={styles.title}>✏️ Edit Profile</h1>

          {message.text && (
            <div style={{
              ...styles.messageBox,
              background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#16a34a' : '#dc2626',
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input type="text" name="name" style={styles.input} value={formData.name} onChange={handleChange} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input type="email" style={{ ...styles.input, ...styles.inputDisabled }} value={formData.email} disabled />
              <p style={styles.hint}>Email cannot be changed</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contact Number</label>
              <input type="tel" name="contact" style={styles.input} value={formData.contact} onChange={handleChange} placeholder="Enter phone number" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <select name="gender" style={styles.select} value={formData.gender} onChange={handleChange}>
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button type="submit" style={{ ...styles.submitBtn, ...(saving ? styles.submitBtnDisabled : {}) }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
