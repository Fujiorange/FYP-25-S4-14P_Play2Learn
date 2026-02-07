import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function UpdatePicture() {
  const navigate = useNavigate();
  const [currentPicture, setCurrentPicture] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getCurrentUser();
    if (user?.profile_picture) {
      setCurrentPicture(user.profile_picture);
    }
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      setMessage({ type: '', text: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // Convert to base64 and send to API
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;
          
          const response = await fetch(`${API_BASE_URL}/api/mongo/teacher/profile/picture`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profile_picture: base64Image })
          });

          const data = await response.json();

          if (data.success) {
            // Update localStorage
            const currentUser = authService.getCurrentUser();
            const updatedUser = { ...currentUser, profile_picture: base64Image };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
            setCurrentPicture(base64Image);
            setSelectedFile(null);
            setPreview(null);
          } else {
            setMessage({ type: 'error', text: data.error || 'Failed to update picture' });
          }
        } catch (error) {
          console.error('Upload error:', error);
          setMessage({ type: 'error', text: 'Failed to upload picture' });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Failed to process image' });
      setUploading(false);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '500px', margin: '0 auto' },
    card: { background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' },
    title: { fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' },
    backBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginBottom: '24px' },
    currentPicture: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 24px', display: 'block', border: '4px solid #e5e7eb' },
    previewPicture: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 24px', display: 'block', border: '4px solid #10b981' },
    placeholder: { width: '150px', height: '150px', borderRadius: '50%', background: '#f3f4f6', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: '#9ca3af' },
    fileInput: { display: 'none' },
    selectBtn: { padding: '12px 24px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginBottom: '16px' },
    uploadBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginLeft: '12px' },
    uploadBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    messageBox: { padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
    hint: { fontSize: '13px', color: '#6b7280', marginTop: '16px' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher/profile')}>← Back to Profile</button>

        <div style={styles.card}>
          <h1 style={styles.title}>📷 Update Profile Picture</h1>

          {message.text && (
            <div style={{
              ...styles.messageBox,
              background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#16a34a' : '#dc2626',
            }}>
              {message.text}
            </div>
          )}

          {preview ? (
            <img src={preview} alt="Preview" style={styles.previewPicture} />
          ) : currentPicture ? (
            <img src={currentPicture} alt="Current" style={styles.currentPicture} />
          ) : (
            <div style={styles.placeholder}>👤</div>
          )}

          <input
            type="file"
            id="fileInput"
            accept="image/*"
            onChange={handleFileSelect}
            style={styles.fileInput}
          />
          
          <div>
            <label htmlFor="fileInput" style={styles.selectBtn}>
              {selectedFile ? 'Change Selection' : 'Select Image'}
            </label>
            
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{ ...styles.uploadBtn, ...(uploading ? styles.uploadBtnDisabled : {}) }}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            )}
          </div>

          <p style={styles.hint}>Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
        </div>
      </div>
    </div>
  );
}
