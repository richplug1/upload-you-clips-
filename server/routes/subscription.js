const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../services/authService');
const database = require('../models/database');
const logger = require('../services/logger');

// Get user subscription and credits
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const subscription = await database.getUserSubscription(userId);
    const credits = await database.getUserCredits(userId);
    
    res.json({
      success: true,
      subscription: subscription || {
        plan: 'free',
        status: 'active',
        credits_remaining: 10,
        monthly_limit: 10,
        expires_at: null
      },
      credits: credits || {
        total_credits: 10,
        used_credits: 0,
        remaining_credits: 10
      }
    });
  } catch (error) {
    logger.error('Error getting subscription status', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        currency: 'USD',
        billing_cycle: 'monthly',
        credits_per_month: 10,
        features: [
          'Up to 10 clips per month',
          'Videos up to 5 minutes',
          'Basic processing',
          'Standard quality exports'
        ],
        limits: {
          max_video_duration: 300, // 5 minutes
          max_clips_per_video: 3,
          max_monthly_credits: 10
        }
      },
      {
        id: 'starter',
        name: 'Starter Plan',
        price: 9.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        credits_per_month: 100,
        features: [
          'Up to 100 clips per month',
          'Videos up to 15 minutes',
          'AI-powered processing',
          'HD quality exports',
          'Priority support'
        ],
        limits: {
          max_video_duration: 900, // 15 minutes
          max_clips_per_video: 10,
          max_monthly_credits: 100
        }
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 29.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        credits_per_month: 500,
        features: [
          'Up to 500 clips per month',
          'Videos up to 1 hour',
          'Advanced AI processing',
          '4K quality exports',
          'Custom templates',
          'API access',
          'Priority support'
        ],
        limits: {
          max_video_duration: 3600, // 1 hour
          max_clips_per_video: 25,
          max_monthly_credits: 500
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 99.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        credits_per_month: 2000,
        features: [
          'Up to 2000 clips per month',
          'Unlimited video duration',
          'Enterprise AI processing',
          'Custom export formats',
          'White-label solution',
          'Dedicated support',
          'Custom integrations'
        ],
        limits: {
          max_video_duration: -1, // unlimited
          max_clips_per_video: 100,
          max_monthly_credits: 2000
        }
      }
    ];

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    logger.error('Error getting subscription plans', { error: error.message });
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
});

// Calculate credits needed for video processing
router.post('/calculate-cost', authenticateToken, async (req, res) => {
  try {
    const { video_duration, clips_count } = req.body;
    
    if (!video_duration || !clips_count) {
      return res.status(400).json({ error: 'Video duration and clips count are required' });
    }

    // Credit calculation formula:
    // Base cost: 1 credit per clip
    // Duration multiplier: +0.1 credit per minute of video
    // Complexity bonus: +0.5 credit for videos over 10 minutes
    
    const baseCost = clips_count * 1; // 1 credit per clip
    const durationMinutes = Math.ceil(video_duration / 60);
    const durationCost = durationMinutes * 0.1;
    const complexityBonus = video_duration > 600 ? clips_count * 0.5 : 0; // 10+ minutes
    
    const totalCredits = Math.ceil(baseCost + durationCost + complexityBonus);
    
    res.json({
      success: true,
      cost_breakdown: {
        base_cost: baseCost,
        duration_cost: durationCost,
        complexity_bonus: complexityBonus,
        total_credits: totalCredits
      },
      video_info: {
        duration_seconds: video_duration,
        duration_minutes: durationMinutes,
        clips_requested: clips_count
      }
    });
  } catch (error) {
    logger.error('Error calculating cost', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate cost' });
  }
});

// Upgrade subscription
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const { plan_id, payment_method } = req.body;
    const userId = req.user.userId;
    
    if (!plan_id) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get plan details
    const plans = [
      { id: 'free', credits: 10, price: 0 },
      { id: 'starter', credits: 100, price: 9.99 },
      { id: 'pro', credits: 500, price: 29.99 },
      { id: 'enterprise', credits: 2000, price: 99.99 }
    ];
    
    const selectedPlan = plans.find(p => p.id === plan_id);
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // For demo purposes, we'll simulate payment processing
    // In production, integrate with Stripe, PayPal, etc.
    if (selectedPlan.price > 0 && !payment_method) {
      return res.status(400).json({ error: 'Payment method required for paid plans' });
    }

    // Update user subscription
    const subscription = await database.updateUserSubscription(userId, {
      plan: plan_id,
      status: 'active',
      credits_remaining: selectedPlan.credits,
      monthly_limit: selectedPlan.credits,
      expires_at: plan_id === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    logger.info('Subscription upgraded', { userId, plan: plan_id, credits: selectedPlan.credits });

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan_id} plan`,
      subscription: subscription,
      credits_added: selectedPlan.credits
    });
  } catch (error) {
    logger.error('Error upgrading subscription', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// Purchase additional credits
router.post('/buy-credits', authenticateToken, async (req, res) => {
  try {
    const { credits_amount, payment_method } = req.body;
    const userId = req.user.userId;
    
    if (!credits_amount || credits_amount <= 0) {
      return res.status(400).json({ error: 'Valid credits amount is required' });
    }

    // Credit pricing: $0.10 per credit
    const pricePerCredit = 0.10;
    const totalPrice = credits_amount * pricePerCredit;

    if (!payment_method) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    // Simulate payment processing
    // In production, integrate with payment provider

    // Add credits to user account
    await database.addUserCredits(userId, credits_amount);

    logger.info('Credits purchased', { userId, credits: credits_amount, price: totalPrice });

    res.json({
      success: true,
      message: `Successfully purchased ${credits_amount} credits`,
      credits_added: credits_amount,
      amount_charged: totalPrice,
      currency: 'USD'
    });
  } catch (error) {
    logger.error('Error purchasing credits', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to purchase credits' });
  }
});

// Deduct credits for video processing
router.post('/deduct-credits', authenticateToken, async (req, res) => {
  try {
    const { credits_to_deduct, video_id, clips_generated } = req.body;
    const userId = req.user.userId;
    
    if (!credits_to_deduct || credits_to_deduct <= 0) {
      return res.status(400).json({ error: 'Valid credits amount is required' });
    }

    // Check if user has enough credits
    const userCredits = await database.getUserCredits(userId);
    if (userCredits.remaining_credits < credits_to_deduct) {
      return res.status(403).json({ 
        error: 'Insufficient credits',
        required: credits_to_deduct,
        available: userCredits.remaining_credits
      });
    }

    // Deduct credits
    await database.deductUserCredits(userId, credits_to_deduct, {
      video_id,
      clips_generated,
      timestamp: new Date()
    });

    logger.info('Credits deducted', { 
      userId, 
      credits: credits_to_deduct, 
      videoId: video_id,
      clipsGenerated: clips_generated 
    });

    res.json({
      success: true,
      message: `${credits_to_deduct} credits deducted`,
      credits_deducted: credits_to_deduct,
      remaining_credits: userCredits.remaining_credits - credits_to_deduct
    });
  } catch (error) {
    logger.error('Error deducting credits', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

// Get credit usage history
router.get('/usage-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;
    
    const history = await database.getCreditUsageHistory(userId, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: history.length
      }
    });
  } catch (error) {
    logger.error('Error getting usage history', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to get usage history' });
  }
});

module.exports = router;
