import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import schoolAdminService from '../../services/schoolAdminService';
import './SchoolAdmin.css';

// Mock data - will be replaced with real API calls
const mockTickets = [
  { id: 'TKT-001', subject: 'Cannot login to my account', description: 'I keep getting an error when trying to login with my email.', category: 'account', priority: 'high', status: 'open', createdBy: { name: 'Alice Tan', email: 'alice@school.edu', role: 'Student', class: 'P1-A' }, createdAt: '2026-01-24T10:30:00', updatedAt: '2026-01-24T10:30:00', responses: [] },
  { id: 'TKT-002', subject: 'Quiz not loading properly', description: 'When I click start quiz, the page just shows loading forever.', category: 'technical', priority: 'urgent', status: 'in_progress', createdBy: { name: 'Bob Lee', email: 'bob@school.edu', role: 'Student', class: 'P1-B' }, createdAt: '2026-01-23T14:15:00', updatedAt: '2026-01-24T09:00:00', responses: [{ by: 'School Admin', message: 'We are looking into this issue.', at: '2026-01-24T09:00:00' }] },
  { id: 'TKT-003', subject: 'Request to reset student passwords', description: 'I need to reset passwords for 5 students who forgot theirs.', category: 'account', priority: 'normal', status: 'resolved', createdBy: { name: 'Mrs. Tan', email: 'mrstan@school.edu', role: 'Teacher' }, createdAt: '2026-01-22T08:45:00', updatedAt: '2026-01-22T11:30:00', responses: [{ by: 'School Admin', message: 'Passwords have been reset. Please check your email.', at: '2026-01-22T11:30:00' }] },
  { id: 'TKT-004', subject: 'Cannot view my child progress', description: 'The progress page shows no data even though my child has completed quizzes.', category: 'technical', priority: 'normal', status: 'open', createdBy: { name: 'Mr. Wong', email: 'wong@email.com', role: 'Parent' }, createdAt: '2026-01-24T16:20:00', updatedAt: '2026-01-24T16:20:00', responses: [] },
  { id: 'TKT-005', subject: 'Wrong score recorded', description: 'My quiz showed 8/10 but the system recorded 6/10.', category: 'quiz', priority: 'high', status: 'open', createdBy: { name: 'Emma Chen', email: 'emma@school.edu', role: 'Student', class: 'P1-A' }, createdAt: '2026-01-24T11:00:00', updatedAt: '2026-01-24T11:00:00', responses: [] }
];

const statusConfig = {
  open: { label: 'Open', color: '#dc2626', bg: '#fef2f2', icon: '🔴' },
  in_progress: { label: 'In Progress', color: '#d97706', bg: '#fffbeb', icon: '🟡' },
  resolved: { label: 'Resolved', color: '#16a34a', bg: '#f0fdf4', icon: '🟢' },
  closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6', icon: '⚫' }
};

const priorityConfig = {
  low: { label: 'Low', color: '#6b7280', bg: '#f3f4f6' },
  normal: { label: 'Normal', color: '#2563eb', bg: '#eff6ff' },
  high: { label: 'High', color: '#d97706', bg: '#fffbeb' },
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2' }
};

const categoryLabels = {
  technical: '🔧 Technical',
  account: '👤 Account',
  quiz: '📝 Quiz',
  assignment: '📚 Assignment',
  other: '📋 Other'
};

export default function SupportTicketManagement() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) { navigate('/login'); return; }
    const currentUser = authService.getCurrentUser();
    if (currentUser.role !== 'school-admin') { navigate('/login'); return; }
    loadTickets();
  }, [navigate]);

  const loadTickets = async () => {
    try {
      // TODO: Replace with real API call
      // const result = await schoolAdminService.getSupportTickets();
      await new Promise(resolve => setTimeout(resolve, 500));
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setMessage({ type: 'error', text: 'Failed to load support tickets' });
    } finally {
      setLoading(false);
    }
  };

  const openTicketDetail = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setReplyText('');
    setShowDetailModal(true);
  };

  const handleUpdateTicket = async () => {
    if (!replyText.trim() && newStatus === selectedTicket.status) {
      setMessage({ type: 'error', text: 'Please add a reply or change the status' });
      return;
    }

    try {
      // TODO: Replace with real API call
      // await schoolAdminService.updateSupportTicket(selectedTicket.id, { status: newStatus, reply: replyText });

      const updatedTicket = {
        ...selectedTicket,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        responses: replyText.trim() ? [
          ...selectedTicket.responses,
          { by: 'School Admin', message: replyText, at: new Date().toISOString() }
        ] : selectedTicket.responses
      };

      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setReplyText('');
      setMessage({ type: 'success', text: 'Ticket updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating ticket:', error);
      setMessage({ type: 'error', text: 'Failed to update ticket' });
    }
  };

  const getTimeSince = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const filteredTickets = tickets
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => 
      searchTerm === '' ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by priority first (urgent > high > normal > low), then by date
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  if (loading) {
    return <div className="sa-loading"><div className="sa-loading-text">Loading support tickets...</div></div>;
  }

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-content">
          <div className="sa-logo">
            <div className="sa-logo-icon">P</div>
            <span className="sa-logo-text">Play2Learn</span>
          </div>
          <button className="sa-button-secondary" onClick={() => navigate('/school-admin')}>← Back to Dashboard</button>
        </div>
      </header>

      <main className="sa-main-wide">
        <div className="badge-page-header">
          <div>
            <h1 className="sa-page-title">🎫 Support Tickets</h1>
            <p className="sa-page-subtitle">Manage support requests from students, teachers, and parents</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
              {statusCounts.open} Open
            </span>
          </div>
        </div>

        {message.text && (
          <div className={`sa-message ${message.type === 'success' ? 'sa-message-success' : 'sa-message-error'}`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        {/* Search Bar */}
        <div className="sa-card sa-mb-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input 
              type="text" 
              className="sa-input" 
              style={{ marginBottom: 0, flex: 1 }}
              placeholder="Search by ticket ID, subject, or user name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="points-tabs">
          <button className={`points-tab ${filter === 'all' ? 'points-tab-active' : ''}`} onClick={() => setFilter('all')}>
            All ({statusCounts.all})
          </button>
          <button className={`points-tab ${filter === 'open' ? 'points-tab-active' : ''}`} onClick={() => setFilter('open')}>
            🔴 Open ({statusCounts.open})
          </button>
          <button className={`points-tab ${filter === 'in_progress' ? 'points-tab-active' : ''}`} onClick={() => setFilter('in_progress')}>
            🟡 In Progress ({statusCounts.in_progress})
          </button>
          <button className={`points-tab ${filter === 'resolved' ? 'points-tab-active' : ''}`} onClick={() => setFilter('resolved')}>
            🟢 Resolved ({statusCounts.resolved})
          </button>
          <button className={`points-tab ${filter === 'closed' ? 'points-tab-active' : ''}`} onClick={() => setFilter('closed')}>
            ⚫ Closed ({statusCounts.closed})
          </button>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="sa-card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</p>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>No tickets found</p>
            <p style={{ color: '#9ca3af' }}>
              {filter !== 'all' ? 'Try changing the filter or search term' : 'No support tickets have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="sa-card">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Subject</th>
                  <th>From</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => {
                  const status = statusConfig[ticket.status];
                  const priority = priorityConfig[ticket.priority];
                  return (
                    <tr key={ticket.id} style={{ cursor: 'pointer' }} onClick={() => openTicketDetail(ticket)}>
                      <td style={{ fontWeight: '600', color: '#2563eb' }}>{ticket.id}</td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{ticket.subject}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.description}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{ticket.createdBy.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {ticket.createdBy.role} {ticket.createdBy.class && `• ${ticket.createdBy.class}`}
                        </div>
                      </td>
                      <td>{categoryLabels[ticket.category] || ticket.category}</td>
                      <td>
                        <span className="sa-badge" style={{ background: priority.bg, color: priority.color }}>
                          {priority.label}
                        </span>
                      </td>
                      <td>
                        <span className="sa-badge" style={{ background: status.bg, color: status.color }}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td style={{ color: '#6b7280', fontSize: '13px' }}>{getTimeSince(ticket.createdAt)}</td>
                      <td>
                        <button className="sa-button-action" onClick={(e) => { e.stopPropagation(); openTicketDetail(ticket); }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Ticket Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="sa-modal" onClick={() => setShowDetailModal(false)}>
          <div className="sa-modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 className="sa-modal-title" style={{ marginBottom: '8px' }}>{selectedTicket.subject}</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{selectedTicket.id}</span>
                  <span className="sa-badge" style={{ background: priorityConfig[selectedTicket.priority].bg, color: priorityConfig[selectedTicket.priority].color }}>
                    {priorityConfig[selectedTicket.priority].label}
                  </span>
                  <span className="sa-badge" style={{ background: statusConfig[selectedTicket.status].bg, color: statusConfig[selectedTicket.status].color }}>
                    {statusConfig[selectedTicket.status].icon} {statusConfig[selectedTicket.status].label}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {/* Ticket Info */}
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>From:</span>
                  <div style={{ fontWeight: '600' }}>{selectedTicket.createdBy.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{selectedTicket.createdBy.email}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {selectedTicket.createdBy.role} {selectedTicket.createdBy.class && `• ${selectedTicket.createdBy.class}`}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Category:</span>
                  <div style={{ fontWeight: '600' }}>{categoryLabels[selectedTicket.category]}</div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Created:</span>
                  <div style={{ fontSize: '13px' }}>{new Date(selectedTicket.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Description:</span>
                <p style={{ margin: '4px 0 0 0', lineHeight: '1.6' }}>{selectedTicket.description}</p>
              </div>
            </div>

            {/* Conversation History */}
            {selectedTicket.responses.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>💬 Conversation</h4>
                {selectedTicket.responses.map((response, index) => (
                  <div key={index} style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #2563eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#2563eb' }}>{response.by}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(response.at).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px' }}>{response.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Section */}
            {selectedTicket.status !== 'closed' && (
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>📝 Reply & Update</h4>
                
                <div className="sa-form-group">
                  <label className="sa-label">Update Status</label>
                  <select className="sa-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="open">🔴 Open</option>
                    <option value="in_progress">🟡 In Progress</option>
                    <option value="resolved">🟢 Resolved</option>
                    <option value="closed">⚫ Closed</option>
                  </select>
                </div>

                <div className="sa-form-group">
                  <label className="sa-label">Add Reply (Optional)</label>
                  <textarea 
                    className="sa-textarea" 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response here..."
                    style={{ minHeight: '100px' }}
                  />
                </div>

                <div className="sa-modal-buttons">
                  <button className="sa-modal-button-cancel" onClick={() => setShowDetailModal(false)}>Close</button>
                  <button className="sa-modal-button-confirm" onClick={handleUpdateTicket}>Update Ticket</button>
                </div>
              </div>
            )}

            {selectedTicket.status === 'closed' && (
              <div style={{ textAlign: 'center', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
                <p style={{ color: '#6b7280', margin: 0 }}>This ticket has been closed.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
