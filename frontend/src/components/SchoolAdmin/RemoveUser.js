import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolAdmin.css';

const mockUsers = [
  { _id: '1', name: "Alice Tan", email: "alice@test.com", role: "student" },
  { _id: '2', name: "Bob Lee", email: "bob@test.com", role: "teacher" },
];

export default function RemoveUser() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // TODO: Replace with API call
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      // TODO: API call
      setUsers(users.filter(u => u._id !== deleteConfirm._id));
      setMessage({ type: 'success', text: `User "${deleteConfirm.name}" removed successfully` });
      setDeleteConfirm(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
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
        <h1 className="sa-page-title">Remove User</h1>
        <p className="sa-page-subtitle">Search and remove user accounts.</p>

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
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td><span className="sa-badge sa-badge-primary">{user.role}</span></td>
                  <td>
                    <button className="sa-button-danger" onClick={() => setDeleteConfirm(user)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="sa-table-empty">No users found</div>
          )}
        </div>
      </main>

      {deleteConfirm && (
        <div className="sa-modal" onClick={() => setDeleteConfirm(null)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="sa-modal-title">Confirm Deletion</h2>
            <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
            <div className="sa-modal-buttons">
              <button className="sa-modal-button-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="sa-modal-button-danger" onClick={handleDelete}>Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}