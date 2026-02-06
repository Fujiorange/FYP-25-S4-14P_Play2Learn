// Utility for calculating student progression and rewards
const SkillRewardSettings = require('../models/SkillRewardSettings');

// Cache for reward settings to avoid repeated database queries
let rewardCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches reward configuration from database with caching
 */
async function fetchRewardConfiguration() {
  const currentTime = Date.now();
  
  if (rewardCache && cacheTimestamp && (currentTime - cacheTimestamp < CACHE_DURATION)) {
    return rewardCache;
  }
  
  let settings = await SkillRewardSettings.find().lean();
  
  if (settings.length === 0) {
    // Bootstrap with initial reward structure
    const initialRewards = [
      { challengeLevel: 1, successReward: 1, failurePenalty: -2.5 },
      { challengeLevel: 2, successReward: 2, failurePenalty: -2.0 },
      { challengeLevel: 3, successReward: 3, failurePenalty: -1.5 },
      { challengeLevel: 4, successReward: 4, failurePenalty: -1.0 },
      { challengeLevel: 5, successReward: 5, failurePenalty: -0.5 }
    ];
    
    await SkillRewardSettings.insertMany(initialRewards);
    settings = initialRewards;
  }
  
  // Build lookup map for O(1) access
  const rewardMap = {};
  settings.forEach(setting => {
    rewardMap[setting.challengeLevel] = {
      correct: setting.successReward,
      incorrect: setting.failurePenalty
    };
  });
  
  rewardCache = rewardMap;
  cacheTimestamp = currentTime;
  
  return rewardMap;
}

/**
 * Calculate points earned for a quiz answer
 */
async function calculateAnswerPoints(difficulty, isCorrect) {
  const rewards = await fetchRewardConfiguration();
  const rewardConfig = rewards[difficulty] || rewards[3]; // Default to level 3 if not found
  
  return isCorrect ? rewardConfig.correct : rewardConfig.incorrect;
}

/**
 * Compute student's rank tier based on accumulated experience
 * Uses custom progression curve: each tier requires exponentially more XP
 */
function computeStudentTier(experiencePoints) {
  if (experiencePoints < 0) return 1;
  
  // Custom tier thresholds: tier 1 needs 0, tier 2 needs 100, tier 3 needs 300, etc.
  const tierThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  
  for (let tier = tierThresholds.length - 1; tier >= 0; tier--) {
    if (experiencePoints >= tierThresholds[tier]) {
      return tier + 1;
    }
  }
  
  return 1;
}

/**
 * Calculate skill tier progression
 * Each skill has 5 levels, requiring 100 XP per level
 */
function computeSkillTier(skillExperience) {
  const xpPerLevel = 100;
  const maxTier = 5;
  
  const tier = Math.floor(skillExperience / xpPerLevel);
  return Math.min(tier, maxTier);
}

/**
 * Calculate XP progress percentage within current tier
 */
function calculateTierProgress(experiencePoints) {
  const currentTier = computeStudentTier(experiencePoints);
  const tierThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  
  if (currentTier >= tierThresholds.length) {
    return 100;
  }
  
  const tierStart = tierThresholds[currentTier - 1];
  const tierEnd = tierThresholds[currentTier];
  const xpInTier = experiencePoints - tierStart;
  const xpNeeded = tierEnd - tierStart;
  
  return Math.min(100, Math.floor((xpInTier / xpNeeded) * 100));
}

/**
 * Invalidate reward configuration cache
 * Call this when admin updates reward settings
 */
function invalidateRewardCache() {
  rewardCache = null;
  cacheTimestamp = null;
}

module.exports = {
  fetchRewardConfiguration,
  calculateAnswerPoints,
  computeStudentTier,
  computeSkillTier,
  calculateTierProgress,
  invalidateRewardCache
};
