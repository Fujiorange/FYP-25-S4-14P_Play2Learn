import React from 'react';
import './Contact.css';

const Contact = ({ data }) => {
  // Use custom data if available
  const faqsData = data?.custom_data?.faqs || [
    {
      question: 'How long does implementation take?',
      answer: 'Typically 2-4 weeks depending on school size. We provide full onboarding support.'
    },
    {
      question: 'Can we integrate with our existing LMS?',
      answer: 'Yes, we support integration with most popular Learning Management Systems including Moodle, Canvas, and Google Classroom.'
    },
    {
      question: 'What kind of training do you provide?',
      answer: 'We offer comprehensive training for teachers and administrators, including documentation, and ongoing support.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'No, unfortunately we do not provide free trial.'
    },
    {
      question: 'How do you ensure data privacy and security?',
      answer: 'We are compliant with major data protection regulations including GDPR and COPPA. All data is encrypted and stored securely.'
    }
  ];

  const contactMethods = data?.custom_data?.contactMethods || [
    {
      icon: '📧',
      title: 'Email',
      details: ['hello@Play2Learn.com', 'support@Play2Learn.com']
    },
    {
      icon: '📞',
      title: 'Phone',
      details: ['+65 6123 4567 (Sales)', '+65 6123 4568 (Support)']
    },
    {
      icon: '📍',
      title: 'Office',
      details: ['123 Innovation Drive', 'Singapore 138543']
    },
    {
      icon: '🕒',
      title: 'Support Hours',
      details: ['Monday - Friday: 9AM - 6PM SGT']
    }
  ];

  const sectionTitle = data?.title || 'Contact & Support';

  return (
    <section id="contact" className="section contact">
      <div className="container">
        <h2 className="section-title">{sectionTitle}</h2>
        
        <div className="contact-content">
          <div className="contact-info">
            <h3>Get in Touch</h3>
            <p>Reach out to us for demonstrations, pricing inquiries, or technical support.</p>
            
            <div className="contact-methods">
              {contactMethods.map((method, index) => (
                <div key={index} className="contact-method">
                  <div className="contact-icon">{method.icon}</div>
                  <div className="contact-details">
                    <h4>{method.title}</h4>
                    {method.details.map((detail, i) => (
                      <p key={i}>{detail}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="support-info">
            <h3>Quick Support</h3>
            <div className="support-options">
              <div className="support-option">
                <h4>📋 Sales Inquiry</h4>
                <p>Contact our sales team for pricing and demonstrations</p>
                <a href="mailto:sales@Play2Learn.com" className="support-link">
                  sales@Play2Learn.com
                </a>
              </div>

              <div className="support-option">
                <h4>🔧 Technical Support</h4>
                <p>Get help with technical issues and platform questions</p>
                <a href="mailto:support@Play2Learn.com" className="support-link">
                  support@Play2Learn.com
                </a>
              </div>

              <div className="support-option">
                <h4>🏫 School Partnerships</h4>
                <p>Discuss institutional partnerships and bulk licensing</p>
                <a href="mailto:partnerships@Play2Learn.com" className="support-link">
                  partnerships@Play2Learn.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqsData.map((faq, index) => (
              <div key={index} className="faq-item">
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;