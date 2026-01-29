import React from 'react';
import './About.css';

const About = ({ data }) => {
  // Parse custom_data if available
  const customData = data?.custom_data || {};
  const sectionTitle = data?.title || 'About Play2Learn';
  
  const mission = customData.mission || 'To transform education by providing adaptive learning solutions that personalize education for every student while empowering teachers with intelligent tools and insights.';
  const vision = customData.vision || 'A world where every learner achieves their full potential through personalized, engaging, and effective educational experiences powered by cutting-edge technology.';
  const goals = customData.goals || [
    'Increase student engagement by 70% through incentive-driven learning',
    'Improve learning outcomes by 50% through adaptive personalization',
    'Reduce teacher workload by 40% with AI-powered assistance',
    'Reach 1 million students within 3 years'
  ];
  
  const stats = customData.stats || [
    { value: '50+', label: 'Schools Partnered' },
    { value: '10,000+', label: 'Active Students' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '40%', label: 'Improvement in Results' }
  ];

  return (
    <section id="about" className="section about">
      <div className="container">
        <h2 className="section-title">{sectionTitle}</h2>
        <div className="about-content">
          <div className="about-text">
            <div className="mission-vision">
              <div className="mv-item">
                <h3>🎯 Our Mission</h3>
                <p>{mission}</p>
              </div>
              <div className="mv-item">
                <h3>👁️ Our Vision</h3>
                <p>{vision}</p>
              </div>
              <div className="mv-item">
                <h3>🎯 Our Goals</h3>
                <ul>
                  {goals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="about-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;