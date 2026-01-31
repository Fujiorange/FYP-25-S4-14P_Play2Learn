const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { analyzeSentiment } = require('../utils/sentimentAnalyzer');


// ==================== TESTIMONIALS ====================
/**
 * @route   POST /api/mongo/teacher/testimonials
 * @desc    Create a new testimonial from teacher
 * @access  Private (Teacher only)
 */
router.post("/testimonials", async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { rating, message, testimonial, title, displayName, allowPublic } = req.body;

    const finalMessage = message || testimonial || '';
    const trimmedMessage = finalMessage.trim();
    
    // Validation
    if (!rating || !trimmedMessage) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating and message are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: "Rating must be between 1 and 5" 
      });
    }

    // Message length validation
    if (trimmedMessage.length < 20) {
      return res.status(400).json({ 
        success: false, 
        error: "Message must be at least 20 characters long" 
      });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ 
        success: false, 
        error: "Message must not exceed 2000 characters" 
      });
    }

    // Perform sentiment analysis
    const sentimentResult = analyzeSentiment(trimmedMessage, rating);
    const sentimentScore = sentimentResult.score;
    const sentimentLabel = sentimentResult.label;


    const testimonialDoc = await Testimonial.create({
      student_id: teacherId,
      student_name: displayName || req.user.name || 'Anonymous Teacher',
      student_email: req.user.email,
      title: title || '',
      rating,
      message: trimmedMessage,
      approved: false,
      display_on_landing: allowPublic !== undefined ? allowPublic : true,
      user_role: 'Teacher',
      sentiment_score: sentimentScore,
      sentiment_label: sentimentLabel,
    });

    res.status(201).json({
      success: true,
      message: "Testimonial submitted successfully (pending approval)",
      testimonial: {
        id: testimonialDoc._id,
        rating: testimonialDoc.rating,
        message: testimonialDoc.message,
        title: testimonialDoc.title,
        created_at: testimonialDoc.created_at,
      }
    });
  } catch (error) {
    console.error("❌ Create teacher testimonial error:", error);
    res.status(500).json({ success: false, error: "Failed to submit testimonial" });
  }
});

/**
 * @route   GET /api/mongo/teacher/testimonials
 * @desc    Get testimonials for current teacher
 * @access  Private (Teacher only)
 */
router.get("/testimonials", async (req, res) => {
  try {
    const teacherId = req.user.userId;
    
    const testimonials = await Testimonial.find({ 
      student_id: teacherId,
      user_role: 'Teacher' 
    })
      .sort({ created_at: -1 });

    res.json({
      success: true,
      testimonials: testimonials.map(t => ({
        id: t._id,
        title: t.title,
        rating: t.rating,
        message: t.message,
        approved: t.approved,
        display_on_landing: t.display_on_landing,
        sentiment_label: t.sentiment_label,
        created_at: t.created_at,
      }))
    });
  } catch (error) {
    console.error("❌ Get teacher testimonials error:", error);
    res.status(500).json({ success: false, error: "Failed to load testimonials" });
  }
});

module.exports = router;
