// frontend/src/components/LandingPage/LandingPage.js
import React, { useState, useEffect } from 'react';
import { getLandingPage } from '../../services/publicService';

// Import all the components
import Header from '../Header/Header';
import Hero from '../Hero/Hero';
import Features from '../Feature/Features';
import About from '../About/About';
import Roadmap from '../Roadmap/Roadmap';
import Testimonials from '../Testimonials/Testimonials';
import Pricing from '../Pricing/Pricing';
import Contact from '../Contact/Contact';
import Footer from '../Footer/Footer';

const LandingPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        setLoading(true);
        const response = await getLandingPage();
        
        if (response.success && response.blocks && response.blocks.length > 0) {
          // Use database blocks
          setBlocks(response.blocks);
        } else {
          // Use default static blocks if no database blocks exist
          setBlocks([
            { type: 'hero', order: 1, is_visible: true },
            { type: 'features', order: 2, is_visible: true },
            { type: 'about', order: 3, is_visible: true },
            { type: 'roadmap', order: 4, is_visible: true },
            { type: 'testimonials', order: 5, is_visible: true },
            { type: 'pricing', order: 6, is_visible: true },
            { type: 'contact', order: 7, is_visible: true },
            { type: 'footer', order: 8, is_visible: true }
          ]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching landing page:', err);
        // On error, use default blocks
        setBlocks([
          { type: 'hero', order: 1, is_visible: true },
          { type: 'features', order: 2, is_visible: true },
          { type: 'about', order: 3, is_visible: true },
          { type: 'roadmap', order: 4, is_visible: true },
          { type: 'testimonials', order: 5, is_visible: true },
          { type: 'pricing', order: 6, is_visible: true },
          { type: 'contact', order: 7, is_visible: true },
          { type: 'footer', order: 8, is_visible: true }
        ]);
        setLoading(false);
      }
    };

    fetchLandingPage();
  }, []);

  // Component mapping
  const componentMap = {
    hero: Hero,
    features: Features,
    about: About,
    roadmap: Roadmap,
    testimonials: Testimonials,
    pricing: Pricing,
    contact: Contact,
    footer: Footer
  };

  const renderBlock = (block) => {
    const Component = componentMap[block.type];
    
    if (!Component) {
      console.warn(`No component found for block type: ${block.type}`);
      return null;
    }

    return <Component key={`${block.type}-${block.order}`} data={block} />;
  };

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          Loading...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      {blocks.map(block => renderBlock(block))}
    </>
  );
};

export default LandingPage;
