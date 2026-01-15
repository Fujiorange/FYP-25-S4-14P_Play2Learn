import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

const mockUsers = [
  { _id: '1', name: "Alice Tan", email: "alice@test.com", role: "student", isActive: true },
  { _id: '2', name: "Bob Lee", email: "bob@test.com", role: "teacher", isActive: false },
];

export default function DisableUser() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = async (user) => {
    try {
      // TODO: API call
      setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      setMessage({ 
        type: 'success', 
        text: `${user.name} has been ${user.isActive ? 'disabled' : 'enabled'}` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update user status' });
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
        <h1 className="sa-page-title">Enable/Disable Users</h1>
        <p className="sa-page-subtitle">Temporarily disable user accounts without deleting them.</p>

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
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`sa-badge ${user.isActive ? 'sa-badge-success' : 'sa-badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={user.isActive ? 'sa-button-disable' : 'sa-button-enable'}
                      onClick={() => handleToggle(user)}
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="sa-table-empty">No users found</div>}
        </div>
      </main>
    </div>
  );
}