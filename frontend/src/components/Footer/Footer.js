import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Play2Learn</h3>
            <p>Transforming education through adaptive learning and incentive-driven engagement.</p>
            <div className="social-links">
              <span className="social-link">LinkedIn</span>
              <span className="social-link">Twitter</span>
              <span className="social-link">Facebook</span>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Platform</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#testimonials">Success Stories</a></li>
              <li><a href="#roadmap">Learning Roadmap</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#contact">Contact Us</a></li>
              <li><span className="footer-link">Documentation</span></li>
              <li><span className="footer-link">Help Center</span></li>
              <li><span className="footer-link">Teacher Resources</span></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><span className="footer-link">Privacy Policy</span></li>
              <li><span className="footer-link">Terms of Service</span></li>
              <li><span className="footer-link">Data Protection</span></li>
              <li><span className="footer-link">Compliance</span></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Play2Learn. All rights reserved. Transforming Education Through Technology.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;