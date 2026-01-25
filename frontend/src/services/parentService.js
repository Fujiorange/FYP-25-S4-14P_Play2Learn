// frontend/src/services/parentService.js - PHASE 2 COMPLETE VERSION
// ✅ Includes ALL methods from Phase 1 + Testimonials, Feedback, Performance, Progress

import authService from './authService';

const API_BASE_URL = 'http://localhost:5000/api/mongo/parent';

class ParentService {
  // ==================== DASHBOARD & CHILDREN (PHASE 1) ====================
  
  async getDashboard() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard');
      }

      return data;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getChildStats(studentId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load child stats');
      }

      return data;
    } catch (error) {
      console.error('Error loading child stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getChildActivities(studentId, limit = 10) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/activities?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load activities');
      }

      return data;
    } catch (error) {
      console.error('Error loading activities:', error);
      return {
        success: false,
        error: error.message,
        activities: []
      };
    }
  }

  async getChildrenSummary() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/children/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load children summary');
      }

      return data;
    } catch (error) {
      console.error('Error loading children summary:', error);
      return {
        success: false,
        error: error.message,
        children: []
      };
    }
  }

  // ==================== SUPPORT TICKETS (PHASE 1) ====================
  
  async createSupportTicket(ticketData) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create support ticket');
      }

      return data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSupportTickets() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/support-tickets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load support tickets');
      }

      return data;
    } catch (error) {
      console.error('Error loading support tickets:', error);
      return {
        success: false,
        error: error.message,
        tickets: []
      };
    }
  }

  async getSupportTicket(ticketId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/support-tickets/${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load ticket details');
      }

      return data;
    } catch (error) {
      console.error('Error loading ticket details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== TESTIMONIALS (PHASE 2 - NEW) ====================
  
  /**
   * Submit a new testimonial
   */
  async submitTestimonial(testimonialData) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/testimonials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testimonialData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit testimonial');
      }

      return data;
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all testimonials submitted by current parent
   */
  async getTestimonials() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/testimonials`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load testimonials');
      }

      return data;
    } catch (error) {
      console.error('Error loading testimonials:', error);
      return {
        success: false,
        error: error.message,
        testimonials: []
      };
    }
  }

  // ==================== FEEDBACK (PHASE 2 - NEW) ====================
  
  /**
   * Get all feedback for parent's children
   */
  async getFeedback() {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load feedback');
      }

      return data;
    } catch (error) {
      console.error('Error loading feedback:', error);
      return {
        success: false,
        error: error.message,
        feedback: []
      };
    }
  }

  /**
   * Mark feedback as read
   */
  async markFeedbackAsRead(feedbackId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark feedback as read');
      }

      return data;
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== PERFORMANCE (PHASE 2 - NEW) ====================
  
  /**
   * Get detailed performance breakdown for a child
   */
  async getChildPerformance(studentId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/performance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load child performance');
      }

      return data;
    } catch (error) {
      console.error('Error loading child performance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== PROGRESS (PHASE 2 - NEW) ====================
  
  /**
   * Get detailed progress tracking for a child
   */
  async getChildProgress(studentId) {
    try {
      const token = authService.getToken();
      
      const response = await fetch(`${API_BASE_URL}/child/${studentId}/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load child progress');
      }

      return data;
    } catch (error) {
      console.error('Error loading child progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getGradeColor(grade) {
    const gradeColors = {
      'A': '#10b981',
      'B': '#3b82f6',
      'C': '#f59e0b',
      'D': '#ef4444',
      'F': '#991b1b',
      'N/A': '#6b7280'
    };
    return gradeColors[grade] || gradeColors['N/A'];
  }

  getProgressEmoji(progress) {
    const emojis = {
      'improving': '📈',
      'stable': '➡️',
      'declining': '📉'
    };
    return emojis[progress] || '➡️';
  }

  getSentimentEmoji(sentiment) {
    const emojis = {
      'positive': '😊',
      'neutral': '😐',
      'concern': '😟'
    };
    return emojis[sentiment] || '😐';
  }

  getSentimentColor(sentiment) {
    const colors = {
      'positive': '#10b981',
      'neutral': '#3b82f6',
      'concern': '#f59e0b'
    };
    return colors[sentiment] || '#6b7280';
  }
}

export default new ParentService();