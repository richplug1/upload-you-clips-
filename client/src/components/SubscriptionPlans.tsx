import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Zap, Crown, Star, Users } from 'lucide-react';
import { subscriptionService, SubscriptionPlan, UserSubscription, UserCredits } from '../services/subscription';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastNotification';

interface SubscriptionPlansProps {
  onPlanSelected?: (plan: SubscriptionPlan) => void;
  currentPlan?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onPlanSelected, currentPlan }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    loadPlansAndStatus();
  }, [isAuthenticated]);

  const loadPlansAndStatus = async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionService.getSubscriptionPlans();
      setPlans(plansData);

      if (isAuthenticated) {
        const statusData = await subscriptionService.getSubscriptionStatus();
        setSubscription(statusData.subscription);
        setCredits(statusData.credits);
      }
    } catch (err) {
      console.error('Error loading subscription data:', err);
      error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      error('Please sign in to upgrade your plan');
      return;
    }

    try {
      setUpgrading(plan.id);
      
      // For demo purposes, simulate payment
      const paymentMethod = plan.price > 0 ? { type: 'demo', token: 'demo_token' } : null;
      
      const result = await subscriptionService.upgradeSubscription(plan.id, paymentMethod);
      success(result.message);
      
      // Reload status
      await loadPlansAndStatus();
      
      if (onPlanSelected) {
        onPlanSelected(plan);
      }
    } catch (err: any) {
      error(err.message || 'Failed to upgrade subscription');
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    const icons = {
      free: <Zap className="w-8 h-8" />,
      starter: <Star className="w-8 h-8" />,
      pro: <Crown className="w-8 h-8" />,
      enterprise: <Users className="w-8 h-8" />
    };
    return icons[planId as keyof typeof icons] || <CreditCard className="w-8 h-8" />;
  };

  const getCurrentPlanId = () => {
    return currentPlan || subscription?.plan || 'free';
  };

  const isCurrentPlan = (planId: string) => {
    return getCurrentPlanId() === planId;
  };

  const formatDuration = (seconds: number) => {
    if (seconds === -1) return 'Unlimited';
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minutes`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {isAuthenticated && subscription && credits && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
              <p className="text-gray-600 capitalize">{subscription.plan} Plan</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{credits.remaining_credits}</div>
              <div className="text-sm text-gray-600">Credits Remaining</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Credits Used</span>
              <span>{credits.used_credits} / {credits.total_credits}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(credits.used_credits / credits.total_credits) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          const planColor = subscriptionService.getPlanColor(plan.id);
          
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                isCurrent ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              {/* Popular badge for Pro plan */}
              {plan.id === 'pro' && (
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white text-center py-2 rounded-t-xl">
                  <span className="text-sm font-semibold">Most Popular</span>
                </div>
              )}
              
              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3" style={{ color: planColor }}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {subscriptionService.formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">/{plan.billing_cycle}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {plan.credits_per_month} credits per month
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Limits
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Max video: {formatDuration(plan.limits.max_video_duration)}</div>
                    <div>Max clips per video: {plan.limits.max_clips_per_video}</div>
                    <div>Monthly credits: {plan.limits.max_monthly_credits}</div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || upgrading === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : upgrading === plan.id
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : plan.id === 'pro'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700'
                      : 'border-2 text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{
                    borderColor: !isCurrent && upgrading !== plan.id ? planColor : undefined,
                    backgroundColor: !isCurrent && upgrading !== plan.id && plan.id !== 'pro' ? 'transparent' : undefined
                  }}
                >
                  {isCurrent ? (
                    'Current Plan'
                  ) : upgrading === plan.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : plan.price === 0 ? (
                    'Downgrade to Free'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How Credits Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong>Base Cost:</strong> 1 credit per clip generated
          </div>
          <div>
            <strong>Duration Bonus:</strong> +0.1 credit per minute of video
          </div>
          <div>
            <strong>Complexity Bonus:</strong> +0.5 credit per clip for videos over 10 minutes
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-3">
          Credits refresh monthly for all paid plans. Unused credits don't roll over.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
