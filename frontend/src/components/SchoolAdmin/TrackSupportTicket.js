// School Admin Track Support Ticket Component
// View tickets created by the school admin
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import schoolAdminService from '../../services/schoolAdminService';

export default function TrackSupportTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      // Check school admin auth
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/login');
        return;
      }
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'School Admin') {
        navigate('/login');
        return;
      }

      try {
        const result = await schoolAdminService.getMySupportTickets();
        if (result.success) {
          setTickets(result.tickets || []);
        }
      } catch (error) {
        console.error('Load tickets error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return { background: '#fee2e2', color: '#991b1b' };
      case 'pending': return { background: '#fef3c7', color: '#92400e' };
      case 'closed': return { background: '#d1fae5', color: '#065f46' };
      default: return { background: '#e5e7eb', color: '#374151' };
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 },
    headerButtons: { display: 'flex', gap: '12px' },
    backButton: { padding: '10px 20px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    createButton: { padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    ticketsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
    ticketCard: { background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
    ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    ticketSubject: { fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 },
    statusBadge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
    ticketMeta: { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
    ticketMessage: { fontSize: '14px', color: '#4b5563', marginTop: '12px', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
    emptyState: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    emptyIcon: { fontSize: '48px', marginBottom: '16px' },
    emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    emptyText: { fontSize: '14px', color: '#6b7280', marginBottom: '20px' },
    loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)' },
    loadingText: { fontSize: '24px', color: '#6b7280', fontWeight: '600' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modalContent: { background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' },
    detailRow: { display: 'flex', marginBottom: '12px' },
    detailLabel: { minWidth: '100px', fontWeight: '600', color: '#6b7280' },
    detailValue: { color: '#1f2937' },
    messageBox: { background: '#f9fafb', padding: '16px', borderRadius: '8px', marginTop: '16px' },
    messageLabel: { fontWeight: '600', color: '#374151', marginBottom: '8px', display: 'block' },
    messageText: { color: '#1f2937', whiteSpace: 'pre-wrap', lineHeight: '1.6' },
    responseBox: { background: '#d1fae5', padding: '16px', borderRadius: '8px', marginTop: '16px' },
    responseLabel: { fontWeight: '600', color: '#065f46', marginBottom: '8px', display: 'block' }
  };

  if (loading) return (<div style={styles.loadingContainer}><div style={styles.loadingText}>Loading tickets...</div></div>);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎫 My Support Tickets</h1>
          <div style={styles.headerButtons}>
            <button style={styles.createButton} onClick={() => navigate('/school-admin/support/create')}>
              + Create Ticket
            </button>
            <button style={styles.backButton} onClick={() => navigate('/school-admin')}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
        
        {tickets.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <h2 style={styles.emptyTitle}>No Tickets Yet</h2>
            <p style={styles.emptyText}>You haven't created any support tickets yet.</p>
            <button style={styles.createButton} onClick={() => navigate('/school-admin/support/create')}>
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div style={styles.ticketsGrid}>
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                style={styles.ticketCard}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div style={styles.ticketHeader}>
                  <h3 style={styles.ticketSubject}>{ticket.subject}</h3>
                  <span style={{...styles.statusBadge, ...getStatusColor(ticket.status)}}>
                    {ticket.status}
                  </span>
                </div>
                <div style={styles.ticketMeta}>
                  📅 Created: {ticket.createdOn} | 🔄 Updated: {ticket.lastUpdate}
                </div>
                <div style={styles.ticketMeta}>
                  📊 Priority: {ticket.priority}
                </div>
                <p style={styles.ticketMessage}>{ticket.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div style={styles.modal} onClick={() => setSelectedTicket(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Ticket Details</h2>
                <button style={styles.closeButton} onClick={() => setSelectedTicket(null)}>×</button>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Status:</span>
                <span style={{...styles.statusBadge, ...getStatusColor(selectedTicket.status)}}>
                  {selectedTicket.status}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Subject:</span>
                <span style={styles.detailValue}>{selectedTicket.subject}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Category:</span>
                <span style={styles.detailValue}>Website-Related</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Priority:</span>
                <span style={styles.detailValue}>{selectedTicket.priority}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Created:</span>
                <span style={styles.detailValue}>{selectedTicket.createdOn}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Updated:</span>
                <span style={styles.detailValue}>{selectedTicket.lastUpdate}</span>
              </div>

              <div style={styles.messageBox}>
                <span style={styles.messageLabel}>📝 Your Message:</span>
                <p style={styles.messageText}>{selectedTicket.message}</p>
              </div>

              {selectedTicket.admin_response && (
                <div style={styles.responseBox}>
                  <span style={{...styles.responseLabel, color: '#065f46'}}>💬 Admin Response:</span>
                  <p style={{...styles.messageText, color: '#065f46'}}>{selectedTicket.admin_response}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
