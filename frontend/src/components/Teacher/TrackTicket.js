import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

export default function TrackTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/mongo/teacher/support-tickets', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setTickets(data.tickets || []);
        } else {
          setError(data.error || 'Failed to load tickets');
        }
      } catch (error) {
        console.error('Error loading tickets:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [navigate]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'open': return { background: '#dbeafe', color: '#1d4ed8' };
      case 'in-progress': return { background: '#fef3c7', color: '#d97706' };
      case 'resolved': return { background: '#dcfce7', color: '#16a34a' };
      default: return { background: '#f3f4f6', color: '#6b7280' };
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)', padding: '32px' },
    content: { maxWidth: '900px', margin: '0 auto' },
    header: { background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    title: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
    card: { background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    backBtn: { padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500', marginBottom: '20px' },
    emptyState: { textAlign: 'center', padding: '60px 20px', color: '#64748b', background: 'white', borderRadius: '16px' },
    badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  };

  if (loading) {
    return <div style={styles.container}><div style={styles.content}><div style={{ textAlign: 'center', padding: '60px' }}><p>Loading tickets...</p></div></div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backBtn} onClick={() => navigate('/teacher')}>← Back to Dashboard</button>
        
        <div style={styles.header}>
          <h1 style={styles.title}>🎫 Support Tickets</h1>
          <p style={{ color: '#64748b' }}>Track your support requests</p>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        {tickets.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '48px', marginBottom: '10px' }}>🎫</p>
            <p style={{ fontSize: '18px', fontWeight: '500' }}>No tickets yet</p>
            <p>Your support tickets will appear here</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket._id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{ticket.subject}</span>
                <span style={{ ...styles.badge, ...getStatusStyle(ticket.status) }}>{ticket.status}</span>
              </div>
              <p style={{ color: '#475569', marginBottom: '12px' }}>{ticket.description}</p>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Priority: {ticket.priority} | Created: {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
