import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

const mockUsers = [
  { _id: '1', name: "Alice Tan", email: "alice@test.com", role: "student" },
  { _id: '2', name: "Bob Lee", email: "bob@test.com", role: "teacher" },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      // TODO: API call
      setMessage({ type: 'success', text: `Password reset for ${selectedUser.name}` });
      setSelectedUser(null);
      setNewPassword('');
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reset password' });
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
        <h1 className="sa-page-title">Reset User Password</h1>
        <p className="sa-page-subtitle">Search for a user and reset their password.</p>

        <div className="sa-card">
          {message.text && (
            <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
              {message.type === 'success' ? '✅' : '⚠️'} {message.text}
            </div>
          )}

          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sa-search-input"
          />

          <table className="sa-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button className="sa-button-warning" onClick={() => setSelectedUser(user)}>Reset Password</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="sa-table-empty">No users found</div>}
        </div>
      </main>

      {selectedUser && (
        <div className="sa-modal" onClick={() => setSelectedUser(null)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">Reset Password for {selectedUser.name}</h2>
            <label className="sa-label">New Password (min. 8 characters)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="sa-input"
            />
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setSelectedUser(null)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleReset}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}