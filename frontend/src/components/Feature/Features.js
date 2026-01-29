import React from 'react';
import './Features.css';

const Features = ({ data }) => {
  // Parse custom_data if available for features array
  const featuresData = data?.custom_data?.features || [
    {
      icon: '🎯',
      title: 'Adaptive Learning Paths',
      description: 'AI-powered personalized learning journeys based on individual student performance and learning styles.'
    },
    {
      icon: '🏆',
      title: 'Incentive System',
      description: 'Gamified rewards and recognition system to motivate students and enhance engagement.'
    },
    {
      icon: '📊',
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboards for teachers to monitor student progress and identify areas for improvement.'
    }
  ];

  const sectionTitle = data?.title || 'Platform Features';

  return (
    <section id="features" className="section features">
      <div className="container">
        <h2 className="section-title">{sectionTitle}</h2>
        <div className="features-grid">
          {featuresData.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Make sure this line exists:
export default Features;