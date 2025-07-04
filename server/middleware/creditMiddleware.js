const database = require('../models/database');
const logger = require('../services/logger');

/**
 * Middleware to check if user has sufficient credits for an operation
 * @param {number} requiredCredits - Number of credits required
 * @param {string} operation - Description of the operation for logging
 */
const checkCredits = (requiredCredits, operation = 'operation') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user's current credits
      const userCredits = await database.getUserCredits(userId);
      
      if (!userCredits) {
        return res.status(404).json({ error: 'User credits not found' });
      }

      // Check if user has sufficient credits
      if (userCredits.remaining_credits < requiredCredits) {
        logger.warn('Insufficient credits for operation', {
          userId,
          operation,
          required: requiredCredits,
          available: userCredits.remaining_credits
        });

        return res.status(403).json({
          error: 'Insufficient credits',
          required: requiredCredits,
          available: userCredits.remaining_credits,
          message: `You need ${requiredCredits - userCredits.remaining_credits} more credits for this ${operation}.`
        });
      }

      // Add credit info to request for use in the route handler
      req.userCredits = userCredits;
      req.requiredCredits = requiredCredits;
      
      next();
    } catch (error) {
      logger.error('Error checking credits', { error: error.message, userId: req.user?.userId });
      res.status(500).json({ error: 'Failed to check credits' });
    }
  };
};

/**
 * Middleware to check subscription limits
 * @param {object} limits - Object containing limit checks { videoDuration?, clipsCount? }
 */
const checkSubscriptionLimits = (limits = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user's subscription
      const subscription = await database.getUserSubscription(userId);
      
      if (!subscription) {
        // Default to free plan limits
        subscription = {
          plan: 'free',
          status: 'active'
        };
      }

      const planLimits = {
        free: { maxDuration: 300, maxClips: 3 },
        starter: { maxDuration: 900, maxClips: 10 },
        pro: { maxDuration: 3600, maxClips: 25 },
        enterprise: { maxDuration: -1, maxClips: 100 }
      };

      const userPlanLimits = planLimits[subscription.plan] || planLimits.free;

      // Check video duration limit
      if (limits.videoDuration && userPlanLimits.maxDuration > 0) {
        const videoDuration = req.body.duration || req.body.video_duration || limits.videoDuration;
        if (videoDuration > userPlanLimits.maxDuration) {
          return res.status(403).json({
            error: 'Video duration exceeds plan limit',
            maxDuration: userPlanLimits.maxDuration,
            currentDuration: videoDuration,
            plan: subscription.plan,
            message: `Your ${subscription.plan} plan allows videos up to ${Math.floor(userPlanLimits.maxDuration / 60)} minutes. Upgrade to process longer videos.`
          });
        }
      }

      // Check clips count limit
      if (limits.clipsCount && userPlanLimits.maxClips > 0) {
        const clipsCount = req.body.clipsCount || req.body.clips_count || limits.clipsCount;
        if (clipsCount > userPlanLimits.maxClips) {
          return res.status(403).json({
            error: 'Clips count exceeds plan limit',
            maxClips: userPlanLimits.maxClips,
            requestedClips: clipsCount,
            plan: subscription.plan,
            message: `Your ${subscription.plan} plan allows up to ${userPlanLimits.maxClips} clips per video. Upgrade to generate more clips.`
          });
        }
      }

      // Add subscription info to request
      req.userSubscription = subscription;
      req.planLimits = userPlanLimits;
      
      next();
    } catch (error) {
      logger.error('Error checking subscription limits', { error: error.message, userId: req.user?.userId });
      res.status(500).json({ error: 'Failed to check subscription limits' });
    }
  };
};

/**
 * Middleware to deduct credits after successful operation
 * Can be used as error-handling middleware or called manually
 */
const deductCredits = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const creditsToDeduct = req.requiredCredits || req.creditsToDeduct;
    
    if (!userId || !creditsToDeduct) {
      return next();
    }

    // Deduct credits
    await database.deductUserCredits(userId, creditsToDeduct, {
      video_id: req.jobId || req.body.jobId,
      clips_generated: req.body.clipsCount || req.body.clips_count,
      operation: req.operation || 'processing',
      timestamp: new Date()
    });

    logger.info('Credits deducted successfully', {
      userId,
      credits: creditsToDeduct,
      operation: req.operation || 'processing'
    });

    next();
  } catch (error) {
    logger.error('Error deducting credits', { error: error.message, userId: req.user?.userId });
    // Don't fail the request if credit deduction fails, but log it
    next();
  }
};

/**
 * Calculate credit cost based on video duration and clips count
 * @param {number} videoDuration - Duration in seconds
 * @param {number} clipsCount - Number of clips to generate
 * @returns {number} Total credits required
 */
const calculateCreditCost = (videoDuration, clipsCount) => {
  // Credit calculation formula:
  // Base cost: 1 credit per clip
  // Duration multiplier: +0.1 credit per minute of video
  // Complexity bonus: +0.5 credit for videos over 10 minutes
  
  const baseCost = clipsCount * 1; // 1 credit per clip
  const durationMinutes = Math.ceil(videoDuration / 60);
  const durationCost = durationMinutes * 0.1;
  const complexityBonus = videoDuration > 600 ? clipsCount * 0.5 : 0; // 10+ minutes
  
  return Math.ceil(baseCost + durationCost + complexityBonus);
};

/**
 * Middleware to calculate and check credits for video processing
 * Combines credit calculation, checking, and subscription limits
 */
const checkVideoProcessingCredits = async (req, res, next) => {
  try {
    const { duration, clipsCount = 3 } = req.body;
    
    if (!duration) {
      return res.status(400).json({ error: 'Video duration is required for credit calculation' });
    }

    // Calculate required credits
    const requiredCredits = calculateCreditCost(duration, clipsCount);
    req.requiredCredits = requiredCredits;
    req.operation = 'video_processing';

    // Check subscription limits first
    await new Promise((resolve, reject) => {
      checkSubscriptionLimits({ videoDuration: duration, clipsCount })(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Then check credits
    await new Promise((resolve, reject) => {
      checkCredits(requiredCredits, 'video processing')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    next();
  } catch (error) {
    if (error.status) {
      // Error from our middleware
      return res.status(error.status).json(error);
    }
    
    logger.error('Error in video processing credit check', { error: error.message });
    res.status(500).json({ error: 'Failed to check processing requirements' });
  }
};

module.exports = {
  checkCredits,
  checkSubscriptionLimits,
  deductCredits,
  calculateCreditCost,
  checkVideoProcessingCredits
};
