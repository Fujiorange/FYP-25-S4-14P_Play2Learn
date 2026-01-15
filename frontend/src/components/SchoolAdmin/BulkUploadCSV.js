import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

export default function BulkUploadCSV() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setMessage({ type: '', text: '' });
    } else {
      setMessage({ type: 'error', text: 'Please select a valid CSV file' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setUploading(true);

    try {
      // TODO: Parse CSV and send to API
      // const response = await fetch('http://localhost:5001/api/school-admin/users/bulk-upload', {...});
      
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Users uploaded successfully!' });
        setFile(null);
        setUploading(false);
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed' });
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,password,role,gender,gradelevel\nJohn Doe,john@test.com,password123,student,male,Primary 1\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    a.click();
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
        <h1 className="sa-page-title">Bulk Upload Users (CSV)</h1>
        <p className="sa-page-subtitle">Upload multiple users at once using a CSV file.</p>

        <div className="sa-card">
          {message.text && (
            <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <div className="sa-mb-4">
            <button className="sa-button-secondary" onClick={downloadTemplate}>
              📥 Download CSV Template
            </button>
          </div>

          <div className="sa-form-group">
            <label className="sa-label">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="sa-file-input"
            />
            {file && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                Selected: <strong>{file.name}</strong>
              </p>
            )}
          </div>

          <div className="sa-mt-4">
            <button 
              className="sa-button-primary" 
              onClick={handleUpload}
              disabled={uploading || !file}
              style={{ opacity: uploading || !file ? 0.5 : 1 }}
            >
              {uploading ? 'Uploading...' : 'Upload Users'}
            </button>
          </div>

          <div className="sa-mt-4" style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', fontSize: '14px', color: '#1e40af' }}>
            <strong>📌 CSV Format:</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              name, email, password, role, gender, gradelevel
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}