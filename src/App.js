import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import Features from './components/Feature/Features';
import About from './components/About/About';
import Roadmap from './components/Roadmap/Roadmap';
import Testimonials from './components/Testimonials/Testimonials';
import Pricing from './components/Pricing/Pricing';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<><Header /><Login /></>} />
          <Route path="/signup" element={<><Header /><Signup /></>} />
          <Route path="/" element={
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
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;