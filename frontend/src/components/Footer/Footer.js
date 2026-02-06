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
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#">LinkedIn</a>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#">Twitter</a>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#">Facebook</a>
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
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#">Documentation</a></li>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#">Help Center</a></li>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#">Teacher Resources</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#">Privacy Policy</a></li>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#">Terms of Service</a></li>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#">Data Protection</a></li>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <li><a href="#">Compliance</a></li>
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