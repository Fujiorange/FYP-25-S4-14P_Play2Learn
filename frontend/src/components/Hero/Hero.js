import React from 'react';
import './Hero.css';

const Hero = ({ data }) => {
  // Use data from props if available, otherwise use defaults
  const title = data?.title || 'Revolutionizing Education Through Adaptive Learning';
  const content = data?.content || 'Personalized learning paths powered by AI with incentive-driven engagement to maximize student success and teacher effectiveness.';
  const imageUrl = data?.image_url;
  
  return (
    <section id="home" className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1>{title}</h1>
            <p>{content}</p>
          </div>
          <div className="hero-image">
            {imageUrl ? (
              <img src={imageUrl} alt="Platform Dashboard Preview" className="hero-image-img" />
            ) : (
              <div className="placeholder-image">
                <span>Platform Dashboard Preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;