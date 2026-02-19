/**
 * Topic Profile Service
 * Manages student performance tracking by topic
 */

const TopicProfile = require('../models/TopicProfile');
const { calculateQuizResults } = require('./scoringUtils');

/**
 * Update or create topic profile after quiz completion
 * @param {String} userId - Student user ID
 * @param {Object} quizAttempt - Completed quiz attempt
 * @param {Object} quiz - Quiz object with topic information
 * @returns {Object} Updated topic profile
 */
async function updateTopicProfileAfterQuiz(userId, quizAttempt, quiz) {
  try {
    const topic = quiz.topic || 'General';
    const quizLevel = quiz.quiz_level || 1;
    
    // Calculate comprehensive quiz results
    const results = calculateQuizResults({
      ...quizAttempt.toObject(),
      quizLevel: quizLevel,
      startedAt: quizAttempt.startedAt,
      completedAt: quizAttempt.completedAt
    });
    
    console.log(`📊 Updating topic profile: ${topic}, User: ${userId}`);
    console.log(`   Points: ${results.totalPoints}, Accuracy: ${results.accuracy}%, Performance: ${results.performanceScore}`);
    
    // Find or create topic profile
    let topicProfile = await TopicProfile.findOne({ userId, topic });
    
    if (!topicProfile) {
      topicProfile = new TopicProfile({
        userId,
        topic
      });
      console.log(`✨ Created new topic profile for ${topic}`);
    }
    
    // Update profile using the model method
    topicProfile.updateAfterQuiz({
      quizId: quizAttempt.quizId,
      quizLevel: quizLevel,
      score: results.totalPoints,
      accuracy: results.accuracy,
      performanceScore: results.performanceScore,
      questionsAnswered: results.totalQuestions,
      correctAnswers: results.correctAnswers
    });
    
    await topicProfile.save();
    
    console.log(`✅ Topic profile updated: ${topic}`);
    console.log(`   Total Points: ${topicProfile.totalPoints}`);
    console.log(`   Quizzes Taken: ${topicProfile.totalQuizzesTaken}`);
    console.log(`   Avg Accuracy: ${topicProfile.averageAccuracy.toFixed(1)}%`);
    
    return topicProfile;
  } catch (error) {
    console.error('Error updating topic profile:', error);
    throw error;
  }
}

/**
 * Get all topic profiles for a user
 * @param {String} userId - Student user ID
 * @returns {Array} Array of topic profiles
 */
async function getUserTopicProfiles(userId) {
  try {
    const profiles = await TopicProfile.find({ userId })
      .sort({ totalPoints: -1 }); // Sort by points descending
    
    return profiles;
  } catch (error) {
    console.error('Error getting user topic profiles:', error);
    throw error;
  }
}

/**
 * Get topic profile for specific user and topic
 * @param {String} userId - Student user ID  
 * @param {String} topic - Topic name
 * @returns {Object} Topic profile or null
 */
async function getTopicProfile(userId, topic) {
  try {
    const profile = await TopicProfile.findOne({ userId, topic });
    return profile;
  } catch (error) {
    console.error('Error getting topic profile:', error);
    throw error;
  }
}

/**
 * Get leaderboard for a specific topic
 * @param {String} topic - Topic name
 * @param {Array} userIds - Optional array of user IDs to filter by (e.g., class)
 * @param {Number} limit - Max number of results (default 100)
 * @returns {Array} Leaderboard data
 */
async function getTopicLeaderboard(topic, userIds = null, limit = 100) {
  try {
    const query = { topic };
    
    if (userIds && userIds.length > 0) {
      query.userId = { $in: userIds };
    }
    
    const profiles = await TopicProfile.find(query)
      .populate('userId', 'name class profile_picture')
      .sort({ totalPoints: -1 })
      .limit(limit)
      .lean();
    
    // Filter out profiles where user was deleted
    const validProfiles = profiles.filter(p => p.userId);
    
    return validProfiles.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId._id,
      name: profile.userId.name,
      class: profile.userId.class,
      profilePicture: profile.userId.profile_picture,
      topic: profile.topic,
      totalPoints: profile.totalPoints,
      averageAccuracy: Math.round(profile.averageAccuracy * 10) / 10,
      quizzesTaken: profile.totalQuizzesTaken,
      bestScore: profile.bestScore,
      highestLevel: profile.highestLevelCompleted
    }));
  } catch (error) {
    console.error('Error getting topic leaderboard:', error);
    throw error;
  }
}

/**
 * Get combined leaderboard across all topics
 * @param {Array} userIds - Optional array of user IDs to filter by (e.g., class)
 * @param {Number} limit - Max number of results (default 100)
 * @returns {Array} Combined leaderboard data
 */
async function getCombinedLeaderboard(userIds = null, limit = 100) {
  try {
    const matchStage = userIds && userIds.length > 0 
      ? { $match: { userId: { $in: userIds } } }
      : { $match: {} };
    
    const leaderboard = await TopicProfile.aggregate([
      matchStage,
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$totalPoints' },
          totalQuizzes: { $sum: '$totalQuizzesTaken' },
          totalQuestionsAnswered: { $sum: '$totalQuestionsAnswered' },
          totalCorrectAnswers: { $sum: '$totalCorrectAnswers' },
          topicCount: { $sum: 1 },
          topics: { $push: {
            topic: '$topic',
            points: '$totalPoints',
            accuracy: '$averageAccuracy'
          }}
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          name: '$userInfo.name',
          class: '$userInfo.class',
          profilePicture: '$userInfo.profile_picture',
          totalPoints: 1,
          totalQuizzes: 1,
          averageAccuracy: {
            $cond: [
              { $gt: ['$totalQuestionsAnswered', 0] },
              { $multiply: [
                { $divide: ['$totalCorrectAnswers', '$totalQuestionsAnswered'] },
                100
              ]},
              0
            ]
          },
          topicCount: 1,
          topics: 1
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit }
    ]);
    
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.name,
      class: entry.class,
      profilePicture: entry.profilePicture,
      totalPoints: entry.totalPoints,
      averageAccuracy: Math.round(entry.averageAccuracy * 10) / 10,
      quizzesTaken: entry.totalQuizzes,
      topicCount: entry.topicCount,
      topics: entry.topics
    }));
  } catch (error) {
    console.error('Error getting combined leaderboard:', error);
    throw error;
  }
}

module.exports = {
  updateTopicProfileAfterQuiz,
  getUserTopicProfiles,
  getTopicProfile,
  getTopicLeaderboard,
  getCombinedLeaderboard
};
