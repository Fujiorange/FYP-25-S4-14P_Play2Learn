// Landing Page Manager Component
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLandingPage, saveLandingPage } from '../../services/p2lAdminService';
import './LandingPageManager.css';

// Initialize default custom_data for each block type
const getDefaultCustomData = (type) => {
  switch(type) {
    case 'features':
      return { features: [{ icon: '', title: '', description: '' }] };
    case 'about':
      return { 
        mission: '', 
        vision: '', 
        goals: [''], 
        stats: [{ value: '', label: '' }] 
      };
    case 'roadmap':
      return { 
        steps: [{ step: 1, title: '', description: '', duration: '' }] 
      };
    case 'testimonials':
      return { 
        testimonials: [{ id: 1, name: '', role: '', quote: '', image: '' }] 
      };
    case 'pricing':
      return { plans: [] };
    case 'contact':
      return { email: '', phone: '', address: '' };
    case 'footer':
      return { copyright: '', links: [] };
    default:
      return {};
  }
};

function LandingPageManager() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
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

  const handleBlockTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({
      ...formData,
      type: newType,
      custom_data: getDefaultCustomData(newType)
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

  // Array handlers for custom_data
  const addArrayItem = (arrayName, defaultItem) => {
    const currentArray = formData.custom_data[arrayName] || [];
    handleCustomDataChange(arrayName, [...currentArray, defaultItem]);
  };

  const updateArrayItem = (arrayName, index, field, value) => {
    const currentArray = [...(formData.custom_data[arrayName] || [])];
    currentArray[index] = { ...currentArray[index], [field]: value };
    handleCustomDataChange(arrayName, currentArray);
  };

  const removeArrayItem = (arrayName, index) => {
    const currentArray = [...(formData.custom_data[arrayName] || [])];
    currentArray.splice(index, 1);
    handleCustomDataChange(arrayName, currentArray);
  };

  const handleAddBlock = () => {
    setEditingIndex(null);
    const newType = 'hero';
    setFormData({
      type: newType,
      title: '',
      content: '',
      image_url: '',
      order: blocks.length,
      is_visible: true,
      custom_data: getDefaultCustomData(newType)
    });
    setShowForm(true);
  };

  const handleEditBlock = (index) => {
    setEditingIndex(index);
    const block = blocks[index];
    setFormData({
      ...block,
      custom_data: block.custom_data || getDefaultCustomData(block.type)
    });
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Render specialized editor based on block type
  const renderCustomDataEditor = () => {
    const { type, custom_data = {} } = formData;

    switch(type) {
      case 'features':
        return (
          <div className="custom-data-section">
            <h4>Features List</h4>
            {(custom_data.features || []).map((feature, idx) => (
              <div key={idx} className="array-item">
                <div className="array-item-header">
                  <h5>Feature {idx + 1}</h5>
                  <button type="button" onClick={() => removeArrayItem('features', idx)} className="btn-remove">
                    Remove
                  </button>
                </div>
                <div className="form-group">
                  <label>Icon/Emoji</label>
                  <input
                    type="text"
                    value={feature.icon || ''}
                    onChange={(e) => updateArrayItem('features', idx, 'icon', e.target.value)}
                    placeholder="e.g., 🎯"
                  />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={feature.title || ''}
                    onChange={(e) => updateArrayItem('features', idx, 'title', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={feature.description || ''}
                    onChange={(e) => updateArrayItem('features', idx, 'description', e.target.value)}
                    rows="3"
                  />
                </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => addArrayItem('features', { icon: '', title: '', description: '' })}
              className="btn-add-item"
            >
              + Add Feature
            </button>
          </div>
        );

      case 'about':
        return (
          <div className="custom-data-section">
            <div className="form-group">
              <label>Mission</label>
              <textarea
                value={custom_data.mission || ''}
                onChange={(e) => handleCustomDataChange('mission', e.target.value)}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Vision</label>
              <textarea
                value={custom_data.vision || ''}
                onChange={(e) => handleCustomDataChange('vision', e.target.value)}
                rows="3"
              />
            </div>
            
            <h4>Goals</h4>
            {(custom_data.goals || []).map((goal, idx) => (
              <div key={idx} className="array-item-inline">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...(custom_data.goals || [])];
                    newGoals[idx] = e.target.value;
                    handleCustomDataChange('goals', newGoals);
                  }}
                  placeholder={`Goal ${idx + 1}`}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const newGoals = [...(custom_data.goals || [])];
                    newGoals.splice(idx, 1);
                    handleCustomDataChange('goals', newGoals);
                  }}
                  className="btn-remove-inline"
                >
                  ×
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => handleCustomDataChange('goals', [...(custom_data.goals || []), ''])}
              className="btn-add-item"
            >
              + Add Goal
            </button>

            <h4>Statistics</h4>
            {(custom_data.stats || []).map((stat, idx) => (
              <div key={idx} className="array-item">
                <div className="array-item-header">
                  <h5>Stat {idx + 1}</h5>
                  <button type="button" onClick={() => removeArrayItem('stats', idx)} className="btn-remove">
                    Remove
                  </button>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Value</label>
                    <input
                      type="text"
                      value={stat.value || ''}
                      onChange={(e) => updateArrayItem('stats', idx, 'value', e.target.value)}
                      placeholder="e.g., 50+"
                    />
                  </div>
                  <div className="form-group">
                    <label>Label</label>
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => updateArrayItem('stats', idx, 'label', e.target.value)}
                      placeholder="e.g., Schools Partnered"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => addArrayItem('stats', { value: '', label: '' })}
              className="btn-add-item"
            >
              + Add Statistic
            </button>
          </div>
        );

      case 'roadmap':
        return (
          <div className="custom-data-section">
            <h4>Roadmap Steps</h4>
            {(custom_data.steps || []).map((step, idx) => (
              <div key={idx} className="array-item">
                <div className="array-item-header">
                  <h5>Step {step.step || idx + 1}</h5>
                  <button type="button" onClick={() => removeArrayItem('steps', idx)} className="btn-remove">
                    Remove
                  </button>
                </div>
                <div className="form-group">
                  <label>Step Number</label>
                  <input
                    type="number"
                    value={step.step || idx + 1}
                    onChange={(e) => updateArrayItem('steps', idx, 'step', parseInt(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={step.title || ''}
                    onChange={(e) => updateArrayItem('steps', idx, 'title', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={step.description || ''}
                    onChange={(e) => updateArrayItem('steps', idx, 'description', e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={step.duration || ''}
                    onChange={(e) => updateArrayItem('steps', idx, 'duration', e.target.value)}
                    placeholder="e.g., 1-2 weeks"
                  />
                </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => addArrayItem('steps', { 
                step: (custom_data.steps?.length || 0) + 1, 
                title: '', 
                description: '', 
                duration: '' 
              })}
              className="btn-add-item"
            >
              + Add Step
            </button>
          </div>
        );

      case 'testimonials':
        return (
          <div className="custom-data-section">
            <h4>Testimonials</h4>
            {(custom_data.testimonials || []).map((testimonial, idx) => (
              <div key={idx} className="array-item">
                <div className="array-item-header">
                  <h5>Testimonial {idx + 1}</h5>
                  <button type="button" onClick={() => removeArrayItem('testimonials', idx)} className="btn-remove">
                    Remove
                  </button>
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={testimonial.name || ''}
                    onChange={(e) => updateArrayItem('testimonials', idx, 'name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={testimonial.role || ''}
                    onChange={(e) => updateArrayItem('testimonials', idx, 'role', e.target.value)}
                    placeholder="e.g., Parent of a 5-year-old"
                  />
                </div>
                <div className="form-group">
                  <label>Quote</label>
                  <textarea
                    value={testimonial.quote || ''}
                    onChange={(e) => updateArrayItem('testimonials', idx, 'quote', e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={testimonial.image || ''}
                    onChange={(e) => updateArrayItem('testimonials', idx, 'image', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => addArrayItem('testimonials', { 
                id: (custom_data.testimonials?.length || 0) + 1,
                name: '', 
                role: '', 
                quote: '', 
                image: '' 
              })}
              className="btn-add-item"
            >
              + Add Testimonial
            </button>
          </div>
        );

      case 'pricing':
      case 'contact':
      case 'footer':
        return (
          <div className="custom-data-section">
            <div className="form-group">
              <label>Custom Data (JSON)</label>
              <textarea
                value={JSON.stringify(custom_data, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData({ ...formData, custom_data: parsed });
                  } catch (err) {
                    // Invalid JSON, keep editing
                  }
                }}
                rows="8"
                placeholder="{}"
                style={{ fontFamily: 'monospace' }}
              />
              <small>Enter valid JSON for custom data</small>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="landing-page-manager">
      <header className="page-header">
        <div>
          <h1>Landing Page Manager</h1>
          <Link to="/p2ladmin/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
        <div className="header-actions">
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
                <select name="type" value={formData.type} onChange={handleBlockTypeChange} required>
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

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                />
              </div>

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

              {renderCustomDataEditor()}

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
              {block.content && <p className="block-content">{block.content.substring(0, 100)}{block.content.length > 100 ? '...' : ''}</p>}
              
              {/* Display custom_data summary */}
              {block.custom_data && Object.keys(block.custom_data).length > 0 && (
                <div className="custom-data-preview">
                  {block.type === 'features' && block.custom_data.features && (
                    <small>✨ {block.custom_data.features.length} feature(s)</small>
                  )}
                  {block.type === 'about' && (
                    <small>
                      📝 {block.custom_data.goals?.length || 0} goal(s), {block.custom_data.stats?.length || 0} stat(s)
                    </small>
                  )}
                  {block.type === 'roadmap' && block.custom_data.steps && (
                    <small>🛣️ {block.custom_data.steps.length} step(s)</small>
                  )}
                  {block.type === 'testimonials' && block.custom_data.testimonials && (
                    <small>💬 {block.custom_data.testimonials.length} testimonial(s)</small>
                  )}
                </div>
              )}
              
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
    </div>
  );
}

export default LandingPageManager;
