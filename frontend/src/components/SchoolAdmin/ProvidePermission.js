import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

const mockUsers = [
  { _id: '1', name: "Alice Tan", email: "alice@test.com", role: "student" },
  { _id: '2', name: "Bob Lee", email: "bob@test.com", role: "teacher" },
];

export default function ProvidePermission() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    if (!selectedRole) {
      setMessage({ type: 'error', text: 'Please select a role' });
      return;
    }

    try {
      // TODO: API call
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, role: selectedRole } : u));
      setMessage({ type: 'success', text: `Role updated for ${editingUser.name}` });
      setEditingUser(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update role' });
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
        <h1 className="sa-page-title">Manage User Permissions</h1>
        <p className="sa-page-subtitle">Assign roles and permissions to users.</p>

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
              <tr><th>Name</th><th>Email</th><th>Current Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td><span className="sa-badge sa-badge-primary">{user.role}</span></td>
                  <td>
                    <button className="sa-button-action" onClick={() => handleEditClick(user)}>Change Role</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="sa-table-empty">No users found</div>}
        </div>
      </main>

      {editingUser && (
        <div className="sa-modal" onClick={() => setEditingUser(null)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">Change Role for {editingUser.name}</h2>
            <label className="sa-label">Select Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="sa-select">
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="school-admin">School Admin</option>
            </select>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="sa-modal-button-confirm" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}