import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchoolRegistrationPage.css';

function SchoolRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    institution_name: '',
    contact_person: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    institution_type: 'school',
    hear_about_us: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (!formData.institution_name.trim()) {
      setError('Institution name is required');
      return false;
    }
    if (!formData.contact_person.trim()) {
      setError('Contact person name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/school-registration/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution_name: formData.institution_name,
          contact_person: formData.contact_person,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          country: formData.country,
          institution_type: formData.institution_type,
          hear_about_us: formData.hear_about_us
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please log in with your credentials.',
              email: formData.email 
            } 
          });
        }, 3000);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="school-registration-page">
        <div className="registration-container">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Registration Successful!</h2>
            <p>Welcome to Play2Learn! Your school has been registered with a Free plan.</p>
            <div className="plan-benefits">
              <h3>Your Free Plan Includes:</h3>
              <ul>
                <li>✅ 1 Teacher account</li>
                <li>✅ 5 Student accounts</li>
                <li>✅ 1 Class</li>
                <li>✅ Full access to adaptive quiz system</li>
              </ul>
            </div>
            <p className="redirect-message">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="school-registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Register Your School</h1>
          <p>Start with our Free plan - no credit card required!</p>
        </div>

        <div className="free-plan-badge">
          <span className="badge-icon">🎁</span>
          <div className="badge-text">
            <strong>Free Plan Includes:</strong> 1 Teacher • 5 Students • 1 Class
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-section">
            <h3>Institution Information</h3>
            
            <div className="form-group">
              <label htmlFor="institution_name">
                Institution Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="institution_name"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                placeholder="e.g., Springfield Elementary School"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="institution_type">
                Institution Type <span className="required">*</span>
              </label>
              <select
                id="institution_type"
                name="institution_type"
                value={formData.institution_type}
                onChange={handleChange}
                required
              >
                <option value="school">School</option>
                <option value="tutoring_center">Tutoring Center</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-group">
              <label htmlFor="contact_person">
                Contact Person Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@school.edu"
                required
              />
              <small>This will be your login email</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country/Region</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., United States"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Account Security</h3>
            
            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="hear_about_us">How did you hear about us?</label>
              <select
                id="hear_about_us"
                name="hear_about_us"
                value={formData.hear_about_us}
                onChange={handleChange}
              >
                <option value="">Select an option</option>
                <option value="search_engine">Search Engine</option>
                <option value="social_media">Social Media</option>
                <option value="referral">Referral</option>
                <option value="advertisement">Advertisement</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-register"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register School'}
            </button>
          </div>

          <div className="form-footer">
            <p>Already have an account? <a href="/login">Log in here</a></p>
            <p className="upgrade-note">
              💡 Need more capacity? You can upgrade to paid plans after registration.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SchoolRegistrationPage;
