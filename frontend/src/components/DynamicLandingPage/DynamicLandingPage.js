// Dynamic Landing Page Component
// This component fetches and renders landing page blocks from the database
import React, { useState, useEffect } from 'react';
import './DynamicLandingPage.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

// Import static components as fallback
import Hero from '../Hero/Hero';
import Features from '../Feature/Features';
import About from '../About/About';
import Roadmap from '../Roadmap/Roadmap';
import Testimonials from '../Testimonials/Testimonials';
import Pricing from '../Pricing/Pricing';
import Contact from '../Contact/Contact';

const DynamicLandingPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLandingPageBlocks();
  }, []);

  const fetchLandingPageBlocks = async () => {
    try {
      const response = await fetch('/api/public/landing-page');
      const data = await response.json();
      
      if (data.success) {
        setBlocks(data.blocks || []);
      } else {
        setError('Failed to load landing page');
      }
    } catch (err) {
      console.error('Error fetching landing page:', err);
      setError('Error loading landing page');
    } finally {
      setLoading(false);
    }
  };

  // Render block based on type
  const renderBlock = (block, index) => {
    if (!block.is_visible) return null;

    switch (block.type) {
      case 'hero':
        return (
          <section key={index} id="home" className="hero dynamic-hero">
            <div className="container">
              <div className="hero-content">
                <div className="hero-text">
                  <h1>{block.title || 'Welcome'}</h1>
                  <p>{block.content || ''}</p>
                </div>
                {block.image_url && (
                  <div className="hero-image">
                    <img src={block.image_url} alt={block.title || 'Hero section'} />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      
      case 'features':
        return (
          <section key={index} id="features" className="section features dynamic-features">
            <div className="container">
              <h2 className="section-title">{block.title || 'Features'}</h2>
              <div className="features-content">
                <p>{block.content || ''}</p>
              </div>
            </div>
          </section>
        );
      
      case 'about':
        return (
          <section key={index} id="about" className="section about dynamic-about">
            <div className="container">
              <h2 className="section-title">{block.title || 'About Us'}</h2>
              <div className="about-content">
                <p>{block.content || ''}</p>
                {block.image_url && <img src={block.image_url} alt={block.title || 'About section'} />}
              </div>
            </div>
          </section>
        );
      
      case 'testimonials':
        return (
          <section key={index} id="testimonials" className="section testimonials dynamic-testimonials">
            <div className="container">
              <h2 className="section-title">{block.title || 'Testimonials'}</h2>
              <div className="testimonials-content">
                <p>{block.content || ''}</p>
              </div>
            </div>
          </section>
        );
      
      case 'pricing':
        return (
          <section key={index} id="pricing" className="section pricing dynamic-pricing">
            <div className="container">
              <h2 className="section-title">{block.title || 'Pricing'}</h2>
              <div className="pricing-content">
                <p>{block.content || ''}</p>
              </div>
            </div>
          </section>
        );
      
      case 'contact':
        return (
          <section key={index} id="contact" className="section contact dynamic-contact">
            <div className="container">
              <h2 className="section-title">{block.title || 'Contact Us'}</h2>
              <div className="contact-content">
                <p>{block.content || ''}</p>
              </div>
            </div>
          </section>
        );
      
      case 'footer':
        return (
          <footer key={index} className="footer dynamic-footer">
            <div className="container">
              <p>{block.content || ''}</p>
            </div>
          </footer>
        );
      
      default:
        return null;
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="dynamic-landing-page">
        <Header />
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If error or no blocks, show static fallback
  if (error || !blocks || blocks.length === 0) {
    return (
      <>
        <Header />
        <Hero />
        <Features />
        <About />
        <Roadmap />
        <Testimonials />
        <Pricing />
        <Contact />
        <Footer />
      </>
    );
  }

  // Render dynamic blocks
  return (
    <div className="dynamic-landing-page">
      <Header />
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default DynamicLandingPage;
