// Landing Page Manager Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLandingPage, saveLandingPage } from '../../services/p2lAdminService';
import './LandingPageManager.css';

function LandingPageManager() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'
  const [formData, setFormData] = useState({
    type: 'hero',
    title: '',
    content: '',
    image_url: '',
    order: 0,
    is_visible: true,
    custom_data: {}
  });

  useEffect(() => {
    fetchLandingPage();
  }, []);

  const fetchLandingPage = async () => {
    try {
      const response = await getLandingPage();
      setBlocks(response.blocks || []);
    } catch (error) {
      console.error('Failed to fetch landing page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleCustomDataChange = (field, value) => {
    setFormData({
      ...formData,
      custom_data: {
        ...formData.custom_data,
        [field]: value
      }
    });
  };

  const handleArrayItemChange = (arrayName, index, field, value) => {
    const array = [...(formData.custom_data[arrayName] || [])];
    array[index] = {
      ...array[index],
      [field]: value
    };
    handleCustomDataChange(arrayName, array);
  };

  const addArrayItem = (arrayName, defaultItem) => {
    const array = [...(formData.custom_data[arrayName] || []), defaultItem];
    handleCustomDataChange(arrayName, array);
  };

  const removeArrayItem = (arrayName, index) => {
    const array = (formData.custom_data[arrayName] || []).filter((_, i) => i !== index);
    handleCustomDataChange(arrayName, array);
  };

  const handleAddBlock = () => {
    setEditingIndex(null);
    setFormData({
      type: 'hero',
      title: '',
      content: '',
      image_url: '',
      order: blocks.length,
      is_visible: true,
      custom_data: {}
    });
    setShowForm(true);
  };

  const handleEditBlock = (index) => {
    setEditingIndex(index);
    setFormData(blocks[index]);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newBlocks = [...blocks];
    
    if (editingIndex !== null) {
      newBlocks[editingIndex] = formData;
    } else {
      newBlocks.push(formData);
    }
    
    setBlocks(newBlocks);
    setShowForm(false);
  };

  const handleDeleteBlock = (index) => {
    if (!window.confirm('Are you sure you want to delete this block?')) {
      return;
    }
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    try {
      await saveLandingPage(blocks);
      alert('Landing page saved successfully!');
    } catch (error) {
      console.error('Failed to save landing page:', error);
      alert(error.message || 'Failed to save landing page');
    }
  };

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    newBlocks.forEach((block, i) => block.order = i);
    setBlocks(newBlocks);
  };

  // Render type-specific form fields
  const renderTypeSpecificFields = () => {
    const type = formData.type;
    const customData = formData.custom_data || {};

    switch (type) {
      case 'hero':
        return (
          <>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Revolutionizing Education Through Adaptive Learning"
                required
              />
            </div>
            <div className="form-group">
              <label>Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="3"
                placeholder="Personalized learning paths powered by AI..."
                required
              />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/hero-image.jpg"
              />
            </div>
          </>
        );

      case 'features':
        const features = customData.features || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Platform Features"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Features List</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('features', { icon: '🎯', title: '', description: '' })}
                  className="btn-add-item"
                >
                  + Add Feature
                </button>
              </div>
              {features.map((feature, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Feature {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('features', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Icon (emoji)</label>
                    <input
                      type="text"
                      value={feature.icon || ''}
                      onChange={(e) => handleArrayItemChange('features', index, 'icon', e.target.value)}
                      placeholder="🎯"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={feature.title || ''}
                      onChange={(e) => handleArrayItemChange('features', index, 'title', e.target.value)}
                      placeholder="Adaptive Learning Paths"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={feature.description || ''}
                      onChange={(e) => handleArrayItemChange('features', index, 'description', e.target.value)}
                      rows="2"
                      placeholder="AI-powered personalized learning journeys..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'about':
        const stats = customData.stats || [];
        const goals = customData.goals || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="About Play2Learn"
              />
            </div>
            <div className="form-group">
              <label>Mission 🎯</label>
              <textarea
                value={customData.mission || ''}
                onChange={(e) => handleCustomDataChange('mission', e.target.value)}
                rows="2"
                placeholder="To transform education by providing..."
              />
            </div>
            <div className="form-group">
              <label>Vision 👁️</label>
              <textarea
                value={customData.vision || ''}
                onChange={(e) => handleCustomDataChange('vision', e.target.value)}
                rows="2"
                placeholder="A world where every learner achieves..."
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Goals 🎯</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('goals', '')}
                  className="btn-add-item"
                >
                  + Add Goal
                </button>
              </div>
              {goals.map((goal, index) => (
                <div key={index} className="array-item-simple">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      newGoals[index] = e.target.value;
                      handleCustomDataChange('goals', newGoals);
                    }}
                    placeholder="Increase student engagement by 70%..."
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('goals', index)}
                    className="btn-remove-item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Statistics</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('stats', { value: '', label: '' })}
                  className="btn-add-item"
                >
                  + Add Stat
                </button>
              </div>
              {stats.map((stat, index) => (
                <div key={index} className="array-item-inline">
                  <input
                    type="text"
                    value={stat.value || ''}
                    onChange={(e) => handleArrayItemChange('stats', index, 'value', e.target.value)}
                    placeholder="50+"
                  />
                  <input
                    type="text"
                    value={stat.label || ''}
                    onChange={(e) => handleArrayItemChange('stats', index, 'label', e.target.value)}
                    placeholder="Schools Partnered"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('stats', index)}
                    className="btn-remove-item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        );

      case 'roadmap':
        const steps = customData.steps || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Learning Journey Roadmap"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Roadmap Steps</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('steps', { step: steps.length + 1, title: '', description: '', duration: '' })}
                  className="btn-add-item"
                >
                  + Add Step
                </button>
              </div>
              {steps.map((step, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Step {step.step || index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('steps', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Step Number</label>
                    <input
                      type="number"
                      value={step.step || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'step', parseInt(e.target.value))}
                      placeholder="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={step.title || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'title', e.target.value)}
                      placeholder="Assessment & Onboarding"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={step.description || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'description', e.target.value)}
                      rows="2"
                      placeholder="Initial student assessment to determine..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={step.duration || ''}
                      onChange={(e) => handleArrayItemChange('steps', index, 'duration', e.target.value)}
                      placeholder="1-2 weeks"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'testimonials':
        const testimonials = customData.testimonials || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Success Stories"
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Hear what our users say about Play2Learn."
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Testimonials</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('testimonials', { name: '', role: '', quote: '', image: '' })}
                  className="btn-add-item"
                >
                  + Add Testimonial
                </button>
              </div>
              {testimonials.map((testimonial, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Testimonial {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('testimonials', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={testimonial.name || ''}
                      onChange={(e) => handleArrayItemChange('testimonials', index, 'name', e.target.value)}
                      placeholder="Alex Johnson"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={testimonial.role || ''}
                      onChange={(e) => handleArrayItemChange('testimonials', index, 'role', e.target.value)}
                      placeholder="Parent of a 5-year-old"
                    />
                  </div>
                  <div className="form-group">
                    <label>Quote</label>
                    <textarea
                      value={testimonial.quote || ''}
                      onChange={(e) => handleArrayItemChange('testimonials', index, 'quote', e.target.value)}
                      rows="3"
                      placeholder="Play2Learn has transformed my child's learning experience..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="text"
                      value={testimonial.image || ''}
                      onChange={(e) => handleArrayItemChange('testimonials', index, 'image', e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'pricing':
        const plans = customData.plans || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Subscription Plans"
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Flexible licensing options for schools of all sizes"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Pricing Plans</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('plans', { 
                    name: '', 
                    description: '', 
                    price: { yearly: 0, monthly: 0 },
                    teachers: 0,
                    students: 0,
                    features: [],
                    popular: false
                  })}
                  className="btn-add-item"
                >
                  + Add Plan
                </button>
              </div>
              {plans.map((plan, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Plan {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('plans', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Plan Name</label>
                    <input
                      type="text"
                      value={plan.name || ''}
                      onChange={(e) => handleArrayItemChange('plans', index, 'name', e.target.value)}
                      placeholder="Starter"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={plan.description || ''}
                      onChange={(e) => handleArrayItemChange('plans', index, 'description', e.target.value)}
                      placeholder="Perfect for small schools and institutions"
                    />
                  </div>
                  <div className="form-group-inline">
                    <div className="form-group">
                      <label>Monthly Price ($)</label>
                      <input
                        type="number"
                        value={plan.price?.monthly || ''}
                        onChange={(e) => {
                          const newPlan = { ...plan, price: { ...plan.price, monthly: parseFloat(e.target.value) } };
                          const newPlans = [...plans];
                          newPlans[index] = newPlan;
                          handleCustomDataChange('plans', newPlans);
                        }}
                        placeholder="250"
                      />
                    </div>
                    <div className="form-group">
                      <label>Yearly Price ($)</label>
                      <input
                        type="number"
                        value={plan.price?.yearly || ''}
                        onChange={(e) => {
                          const newPlan = { ...plan, price: { ...plan.price, yearly: parseFloat(e.target.value) } };
                          const newPlans = [...plans];
                          newPlans[index] = newPlan;
                          handleCustomDataChange('plans', newPlans);
                        }}
                        placeholder="2500"
                      />
                    </div>
                  </div>
                  <div className="form-group-inline">
                    <div className="form-group">
                      <label>Max Teachers</label>
                      <input
                        type="number"
                        value={plan.teachers || ''}
                        onChange={(e) => handleArrayItemChange('plans', index, 'teachers', parseInt(e.target.value))}
                        placeholder="50"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Students</label>
                      <input
                        type="number"
                        value={plan.students || ''}
                        onChange={(e) => handleArrayItemChange('plans', index, 'students', parseInt(e.target.value))}
                        placeholder="500"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={plan.popular || false}
                        onChange={(e) => handleArrayItemChange('plans', index, 'popular', e.target.checked)}
                      />
                      {' '}Mark as Popular
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Features (one per line)</label>
                    <textarea
                      value={(plan.features || []).join('\n')}
                      onChange={(e) => {
                        const features = e.target.value.split('\n').filter(f => f.trim());
                        handleArrayItemChange('plans', index, 'features', features);
                      }}
                      rows="4"
                      placeholder="Basic adaptive learning paths&#10;Standard analytics dashboard&#10;Email support"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'contact':
        const contactMethods = customData.contactMethods || [];
        const faqs = customData.faqs || [];
        return (
          <>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contact & Support"
              />
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>Contact Methods</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('contactMethods', { icon: '📧', title: '', details: [] })}
                  className="btn-add-item"
                >
                  + Add Contact Method
                </button>
              </div>
              {contactMethods.map((method, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>Contact Method {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('contactMethods', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Icon (emoji)</label>
                    <input
                      type="text"
                      value={method.icon || ''}
                      onChange={(e) => handleArrayItemChange('contactMethods', index, 'icon', e.target.value)}
                      placeholder="📧"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={method.title || ''}
                      onChange={(e) => handleArrayItemChange('contactMethods', index, 'title', e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Details (one per line)</label>
                    <textarea
                      value={(method.details || []).join('\n')}
                      onChange={(e) => {
                        const details = e.target.value.split('\n').filter(d => d.trim());
                        handleArrayItemChange('contactMethods', index, 'details', details);
                      }}
                      rows="2"
                      placeholder="hello@Play2Learn.com&#10;support@Play2Learn.com"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="form-section">
              <div className="section-header">
                <h4>FAQs</h4>
                <button
                  type="button"
                  onClick={() => addArrayItem('faqs', { question: '', answer: '' })}
                  className="btn-add-item"
                >
                  + Add FAQ
                </button>
              </div>
              {faqs.map((faq, index) => (
                <div key={index} className="array-item">
                  <div className="item-header">
                    <h5>FAQ {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('faqs', index)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Question</label>
                    <input
                      type="text"
                      value={faq.question || ''}
                      onChange={(e) => handleArrayItemChange('faqs', index, 'question', e.target.value)}
                      placeholder="How long does implementation take?"
                    />
                  </div>
                  <div className="form-group">
                    <label>Answer</label>
                    <textarea
                      value={faq.answer || ''}
                      onChange={(e) => handleArrayItemChange('faqs', index, 'answer', e.target.value)}
                      rows="2"
                      placeholder="Typically 2-4 weeks depending on school size..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'footer':
        return (
          <>
            <div className="form-group">
              <label>Footer Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="3"
                placeholder="© 2024 Play2Learn. All rights reserved."
              />
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="4"
              />
            </div>
          </>
        );
    }
  };

  // Render block preview based on type
  const renderBlockPreview = (block) => {
    if (!block.is_visible) return null;

    switch (block.type) {
      case 'hero':
        return (
          <section className="preview-hero">
            <div className="preview-container">
              <div className="preview-hero-content">
                <h1>{block.title || 'Hero Title'}</h1>
                <p>{block.content || 'Hero content will appear here'}</p>
                {block.image_url && <img src={block.image_url} alt={block.title || 'Hero section image'} />}
              </div>
            </div>
          </section>
        );
      
      case 'features':
        return (
          <section className="preview-features">
            <div className="preview-container">
              <h2>{block.title || 'Features'}</h2>
              <div className="preview-features-content">
                <p>{block.content || 'Features content will appear here'}</p>
              </div>
            </div>
          </section>
        );
      
      case 'about':
        return (
          <section className="preview-about">
            <div className="preview-container">
              <h2>{block.title || 'About Us'}</h2>
              <div className="preview-about-content">
                <p>{block.content || 'About content will appear here'}</p>
                {block.image_url && <img src={block.image_url} alt={block.title || 'About section image'} />}
              </div>
            </div>
          </section>
        );
      
      case 'testimonials':
        return (
          <section className="preview-testimonials">
            <div className="preview-container">
              <h2>{block.title || 'Testimonials'}</h2>
              <div className="preview-testimonial-content">
                <p>{block.content || 'Testimonials will appear here'}</p>
              </div>
            </div>
          </section>
        );
      
      case 'pricing':
        return (
          <section className="preview-pricing">
            <div className="preview-container">
              <h2>{block.title || 'Pricing'}</h2>
              <div className="preview-pricing-content">
                <p>{block.content || 'Pricing information will appear here'}</p>
              </div>
            </div>
          </section>
        );
      
      case 'contact':
        return (
          <section className="preview-contact">
            <div className="preview-container">
              <h2>{block.title || 'Contact Us'}</h2>
              <div className="preview-contact-content">
                <p>{block.content || 'Contact information will appear here'}</p>
              </div>
            </div>
          </section>
        );
      
      case 'footer':
        return (
          <footer className="preview-footer">
            <div className="preview-container">
              <p>{block.content || 'Footer content will appear here'}</p>
            </div>
          </footer>
        );
      
      default:
        return (
          <section className="preview-default">
            <div className="preview-container">
              <h2>{block.title || 'Content Block'}</h2>
              <p>{block.content || 'Content will appear here'}</p>
            </div>
          </section>
        );
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="landing-page-manager">
      <header className="page-header">
        <div>
          <h1>Landing Page Manager</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button 
              onClick={() => setViewMode('edit')} 
              className={viewMode === 'edit' ? 'active' : ''}
            >
              ✏️ Edit Mode
            </button>
            <button 
              onClick={() => setViewMode('preview')} 
              className={viewMode === 'preview' ? 'active' : ''}
            >
              👁️ Preview
            </button>
          </div>
          <button onClick={handleAddBlock} className="btn-primary">
            + Add Block
          </button>
          <button onClick={handleSave} className="btn-save">
            💾 Save Changes
          </button>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingIndex !== null ? 'Edit Block' : 'Add New Block'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Block Type *</label>
                <select name="type" value={formData.type} onChange={handleInputChange} required>
                  <option value="hero">Hero</option>
                  <option value="features">Features</option>
                  <option value="about">About</option>
                  <option value="roadmap">Roadmap</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="pricing">Pricing</option>
                  <option value="contact">Contact</option>
                  <option value="footer">Footer</option>
                </select>
              </div>

              {renderTypeSpecificFields()}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_visible"
                    checked={formData.is_visible}
                    onChange={handleInputChange}
                  />
                  {' '}Visible
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingIndex !== null ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'preview' ? (
        <div className="landing-preview">
          <div className="preview-notice">
            <p>📋 Preview Mode - This is how your landing page will look to visitors</p>
          </div>
          {blocks.length === 0 ? (
            <div className="preview-empty">
              <p>No blocks to preview. Add some blocks to see the preview!</p>
            </div>
          ) : (
            <div className="preview-content">
              {[...blocks]
                .sort((a, b) => a.order - b.order)
                .map((block, index) => (
                  <div key={index}>
                    {renderBlockPreview(block)}
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="blocks-list">
          {blocks.length === 0 ? (
            <p className="no-data">No blocks added yet. Create your first block!</p>
          ) : (
            blocks.map((block, index) => (
              <div key={index} className={`block-card ${!block.is_visible ? 'hidden' : ''}`}>
                <div className="block-header">
                  <span className="block-type">{block.type.toUpperCase()}</span>
                  {!block.is_visible && <span className="hidden-badge">Hidden</span>}
                </div>
                
                <h3>{block.title || 'No Title'}</h3>
                <p className="block-content">{block.content?.substring(0, 100)}...</p>
                
                <div className="block-actions">
                  <button onClick={() => moveBlock(index, 'up')} disabled={index === 0}>
                    ↑
                  </button>
                  <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1}>
                    ↓
                  </button>
                  <button onClick={() => handleEditBlock(index)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteBlock(index)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default LandingPageManager;
