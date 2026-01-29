import React from 'react';
import './Testimonial.css';

const Testimonials = ({ data }) => {
  // Parse custom_data if available for testimonials array
  const testimonialsData = data?.custom_data?.testimonials || [
    {
      id: 1,
      name: 'Alex Johnson',
      role: 'Parent of a 5-year-old',
      quote: 'Play2Learn has transformed my child\'s learning experience. The games are fun and educational, making homework feel like playtime!',
      image: 'https://via.placeholder.com/100x100?text=AJ',
    },
    {
      id: 2,
      name: 'Maria Gonzalez',
      role: 'Elementary School Teacher',
      quote: 'As a teacher, I love how Play2Learn integrates interactive elements into lessons. My students are more engaged and retain information better.',
      image: 'https://via.placeholder.com/100x100?text=MG',
    },
    {
      id: 3,
      name: 'David Lee',
      role: 'High School Student',
      quote: 'Play2Learn helped me ace my math exams. The gamified challenges made studying addictive and effective. Highly recommend!',
      image: 'https://via.placeholder.com/100x100?text=DL',
    },
    {
      id: 4,
      name: 'Sophia Patel',
      role: 'Homeschooling Mom',
      quote: 'With Play2Learn, homeschooling is no longer a chore. The variety of subjects and adaptive difficulty keep my kids motivated every day.',
      image: 'https://via.placeholder.com/100x100?text=SP',
    },
  ];

  const sectionTitle = data?.title || 'Success Stories';
  const sectionDescription = data?.content || 'Hear what our users say about Play2Learn.';

  return (
    <section id="testimonials" className="section testimonials">
      <div className="container">
        <h2 className="section-title">{sectionTitle}</h2>
        <p>{sectionDescription}</p>
        <div className="testimonials-grid">
          {testimonialsData.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <img src={testimonial.image} alt={`${testimonial.name}'s photo`} className="testimonial-image" />
              <blockquote className="testimonial-quote">"{testimonial.quote}"</blockquote>
              <cite className="testimonial-cite">
                <strong>{testimonial.name}</strong>, {testimonial.role}
              </cite>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;