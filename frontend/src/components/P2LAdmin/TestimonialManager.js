// Testimonial Management Component for P2L Admin
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getTestimonials,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialStats,
  rebalanceTestimonials
} from '../../services/p2lAdminService';
import './TestimonialManager.css';

function TestimonialManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [publishedTestimonials, setPublishedTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('published'); // 'published' or 'all'
  const [filters, setFilters] = useState({
    minRating: '',
    sentiment: '',
    userRole: '',
    publishedStatus: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllTestimonials();
    } else {
      fetchPublishedTestimonials();
    }
  }, [activeTab, filters]);

  const fetchData = async () => {
    await Promise.all([
      fetchStats(),
      fetchPublishedTestimonials(),
      fetchAllTestimonials()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await getTestimonialStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPublishedTestimonials = async () => {
    try {
      const response = await getTestimonials({ publishedStatus: 'published' });
      if (response.success) {
        setPublishedTestimonials(response.testimonials || []);
      }
    } catch (error) {
      console.error('Failed to fetch published testimonials:', error);
    }
  };

  const fetchAllTestimonials = async () => {
    try {
      const response = await getTestimonials(filters);
      if (response.success) {
        setTestimonials(response.testimonials || []);
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    }
  };

  const handlePublishToggle = async (id, currentStatus) => {
    try {
      const result = await updateTestimonial(id, { 
        published_to_landing: !currentStatus 
      });
      
      if (result.success) {
        await fetchData(); // Refresh all data
      } else {
        alert(result.error || 'Failed to update testimonial');
      }
    } catch (error) {
      console.error('Failed to update testimonial:', error);
      alert('Failed to update testimonial. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await deleteTestimonial(id);
      if (result.success) {
        await fetchData(); // Refresh all data
      } else {
        alert(result.error || 'Failed to delete testimonial');
      }
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
      alert('Failed to delete testimonial. Please try again.');
    }
  };

  const handleRebalance = async () => {
    try {
      const result = await rebalanceTestimonials();
      if (result.success) {
        alert(result.message);
        await fetchData(); // Refresh all data
      } else {
        alert(result.message || 'Failed to rebalance testimonials');
      }
    } catch (error) {
      console.error('Failed to rebalance testimonials:', error);
      alert('Failed to rebalance testimonials. Please try again.');
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minRating: '',
      sentiment: '',
      userRole: '',
      publishedStatus: ''
    });
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getSentimentClass = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'sentiment-positive';
      case 'negative':
        return 'sentiment-negative';
      case 'neutral':
      default:
        return 'sentiment-neutral';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTestimonialCard = (testimonial) => (
    <div key={testimonial.id} className="testimonial-item">
      <div className="testimonial-header">
        <div className="testimonial-meta">
          <strong>{testimonial.student_name}</strong>
          <span className="user-role-badge">{testimonial.user_role}</span>
          {testimonial.auto_published && (
            <span className="auto-badge">Auto-Published</span>
          )}
        </div>
        <div className="rating-display">
          {renderStars(testimonial.rating)}
        </div>
      </div>
      
      <div className="testimonial-message">
        {testimonial.message}
      </div>
      
      <div className="testimonial-footer">
        <div className="testimonial-info">
          <span className={`sentiment-badge ${getSentimentClass(testimonial.sentiment_label)}`}>
            {testimonial.sentiment_label}
          </span>
          <span className="date-info">
            Created: {formatDate(testimonial.created_at)}
          </span>
          {testimonial.published_date && (
            <span className="date-info">
              Published: {formatDate(testimonial.published_date)}
            </span>
          )}
        </div>
        
        <div className="testimonial-actions">
          <button
            onClick={() => handlePublishToggle(testimonial.id, testimonial.published_to_landing)}
            className={testimonial.published_to_landing ? 'btn-unpublish' : 'btn-publish'}
          >
            {testimonial.published_to_landing ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={() => handleDelete(testimonial.id)}
            className="btn-delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="testimonial-manager">
        <div className="loading">Loading testimonial data...</div>
      </div>
    );
  }

  return (
    <div className="testimonial-manager">
      <header className="page-header">
        <div>
          <h1>Testimonial Management</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <div className="header-actions">
          <button onClick={handleRebalance} className="btn-secondary">
            🔄 Rebalance Published
          </button>
        </div>
      </header>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-value">{stats.total_testimonials}</div>
            <div className="stat-label">Total Testimonials</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">{stats.published_count}/{stats.max_published_limit}</div>
            <div className="stat-label">Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.auto_published_count}</div>
            <div className="stat-label">Auto-Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.manual_published_count}</div>
            <div className="stat-label">Manual Published</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.average_rating.toFixed(1)}⭐</div>
            <div className="stat-label">Avg Rating</div>
          </div>
          <div className="stat-card sentiment">
            <div className="stat-label">Sentiment</div>
            <div className="sentiment-breakdown">
              <span className="positive">✓ {stats.sentiment_distribution.positive}</span>
              <span className="neutral">− {stats.sentiment_distribution.neutral}</span>
              <span className="negative">✗ {stats.sentiment_distribution.negative}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('published')}
          className={activeTab === 'published' ? 'active' : ''}
        >
          📌 Currently Published ({publishedTestimonials.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={activeTab === 'all' ? 'active' : ''}
        >
          📋 All Testimonials ({testimonials.length})
        </button>
      </div>

      {/* Filters (only show for 'all' tab) */}
      {activeTab === 'all' && (
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-group">
              <label>Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sentiment</label>
              <select
                value={filters.sentiment}
                onChange={(e) => handleFilterChange('sentiment', e.target.value)}
              >
                <option value="">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div className="filter-group">
              <label>User Type</label>
              <select
                value={filters.userRole}
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Student">Student</option>
                <option value="Parent">Parent</option>
                <option value="Teacher">Teacher</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Published Status</label>
              <select
                value={filters.publishedStatus}
                onChange={(e) => handleFilterChange('publishedStatus', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>

            <button onClick={clearFilters} className="btn-clear-filters">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      <div className="testimonials-container">
        {activeTab === 'published' ? (
          <>
            {publishedTestimonials.length === 0 ? (
              <div className="empty-state">
                <p>No testimonials are currently published.</p>
                <p>5-star positive testimonials are auto-published, or you can manually publish any testimonial.</p>
              </div>
            ) : (
              <div className="testimonials-grid">
                {publishedTestimonials.map(renderTestimonialCard)}
              </div>
            )}
          </>
        ) : (
          <>
            {testimonials.length === 0 ? (
              <div className="empty-state">
                <p>No testimonials match your filters.</p>
              </div>
            ) : (
              <div className="testimonials-grid">
                {testimonials.map(renderTestimonialCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TestimonialManager;
