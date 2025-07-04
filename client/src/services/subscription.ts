import axios from 'axios';
import { config } from '../config/env';

// Helper function for API calls with auth
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const response = await axios({
    method: options.method || 'GET',
    url: `${config.api.baseUrl}${endpoint}`,
    data: options.body ? JSON.parse(options.body as string) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
  return response.data;
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  credits_per_month: number;
  features: string[];
  limits: {
    max_video_duration: number;
    max_clips_per_video: number;
    max_monthly_credits: number;
  };
}

export interface UserSubscription {
  plan: string;
  status: string;
  credits_remaining: number;
  monthly_limit: number;
  expires_at: string | null;
}

export interface UserCredits {
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
}

export interface CostBreakdown {
  base_cost: number;
  duration_cost: number;
  complexity_bonus: number;
  total_credits: number;
}

export interface CreditTransaction {
  id: number;
  transaction_type: string;
  amount: number;
  description: string;
  video_id?: number;
  clips_generated?: number;
  created_at: string;
}

class SubscriptionService {
  // Get user's current subscription status
  async getSubscriptionStatus(): Promise<{ subscription: UserSubscription; credits: UserCredits }> {
    const response = await apiCall('/api/subscription/status', {
      method: 'GET'
    });
    return response;
  }

  // Get available subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiCall('/api/subscription/plans', {
      method: 'GET'
    });
    return response.plans;
  }

  // Calculate cost for video processing
  async calculateProcessingCost(videoDuration: number, clipsCount: number): Promise<{
    cost_breakdown: CostBreakdown;
    video_info: {
      duration_seconds: number;
      duration_minutes: number;
      clips_requested: number;
    };
  }> {
    const response = await apiCall('/api/subscription/calculate-cost', {
      method: 'POST',
      body: JSON.stringify({
        video_duration: videoDuration,
        clips_count: clipsCount
      })
    });
    return response;
  }

  // Upgrade subscription
  async upgradeSubscription(planId: string, paymentMethod?: any): Promise<{
    message: string;
    subscription: UserSubscription;
    credits_added: number;
  }> {
    const response = await apiCall('/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        payment_method: paymentMethod
      })
    });
    return response;
  }

  // Purchase additional credits
  async purchaseCredits(creditsAmount: number, paymentMethod: any): Promise<{
    message: string;
    credits_added: number;
    amount_charged: number;
    currency: string;
  }> {
    const response = await apiCall('/api/subscription/buy-credits', {
      method: 'POST',
      body: JSON.stringify({
        credits_amount: creditsAmount,
        payment_method: paymentMethod
      })
    });
    return response;
  }

  // Deduct credits for processing
  async deductCredits(creditsToDeduct: number, videoId: number, clipsGenerated: number): Promise<{
    message: string;
    credits_deducted: number;
    remaining_credits: number;
  }> {
    const response = await apiCall('/api/subscription/deduct-credits', {
      method: 'POST',
      body: JSON.stringify({
        credits_to_deduct: creditsToDeduct,
        video_id: videoId,
        clips_generated: clipsGenerated
      })
    });
    return response;
  }

  // Get credit usage history
  async getCreditUsageHistory(limit = 50, offset = 0): Promise<{
    history: CreditTransaction[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> {
    const response = await apiCall(`/api/subscription/usage-history?limit=${limit}&offset=${offset}`, {
      method: 'GET'
    });
    return response;
  }

  // Helper methods
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatPrice(price: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  getPlanColor(planId: string): string {
    const colors = {
      free: '#6b7280',      // gray
      starter: '#3b82f6',   // blue
      pro: '#7c3aed',       // purple
      enterprise: '#059669' // emerald
    };
    return colors[planId as keyof typeof colors] || '#6b7280';
  }

  canProcessVideo(subscription: UserSubscription, videoDuration: number, clipsCount: number): {
    canProcess: boolean;
    reason?: string;
    suggestion?: string;
  } {
    // Check credits
    if (subscription.credits_remaining <= 0) {
      return {
        canProcess: false,
        reason: 'No credits remaining',
        suggestion: 'Purchase more credits or upgrade your plan'
      };
    }

    // Get plan limits (this would typically come from the plan data)
    const planLimits = {
      free: { maxDuration: 300, maxClips: 3 },
      starter: { maxDuration: 900, maxClips: 10 },
      pro: { maxDuration: 3600, maxClips: 25 },
      enterprise: { maxDuration: -1, maxClips: 100 }
    };

    const limits = planLimits[subscription.plan as keyof typeof planLimits];
    if (!limits) {
      return { canProcess: true };
    }

    // Check video duration
    if (limits.maxDuration > 0 && videoDuration > limits.maxDuration) {
      return {
        canProcess: false,
        reason: `Video duration (${this.formatDuration(videoDuration)}) exceeds plan limit (${this.formatDuration(limits.maxDuration)})`,
        suggestion: 'Upgrade to a higher plan for longer videos'
      };
    }

    // Check clips count
    if (clipsCount > limits.maxClips) {
      return {
        canProcess: false,
        reason: `Clips count (${clipsCount}) exceeds plan limit (${limits.maxClips})`,
        suggestion: 'Reduce the number of clips or upgrade your plan'
      };
    }

    return { canProcess: true };
  }
}

export const subscriptionService = new SubscriptionService();
