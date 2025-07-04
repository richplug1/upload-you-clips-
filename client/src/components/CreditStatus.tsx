import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, AlertTriangle, Plus, TrendingUp } from 'lucide-react';
import { subscriptionService, UserSubscription, UserCredits } from '../services/subscription';
import { useAuth } from '../contexts/AuthContext';

interface CreditStatusProps {
  showDetails?: boolean;
  onUpgradeClick?: () => void;
  onBuyCreditsClick?: () => void;
}

const CreditStatus: React.FC<CreditStatusProps> = ({ 
  showDetails = true, 
  onUpgradeClick, 
  onBuyCreditsClick 
}) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadCreditsStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadCreditsStatus = async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscription(status.subscription);
      setCredits(status.credits);
    } catch (error) {
      console.error('Failed to load credit status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!credits) return 'gray';
    const remaining = credits.remaining_credits;
    const total = credits.total_credits;
    const percentage = (remaining / total) * 100;
    
    if (percentage <= 10) return 'red';
    if (percentage <= 25) return 'orange';
    if (percentage <= 50) return 'yellow';
    return 'green';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    const icons = {
      red: <AlertTriangle className="w-5 h-5 text-red-500" />,
      orange: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      yellow: <Zap className="w-5 h-5 text-yellow-500" />,
      green: <Zap className="w-5 h-5 text-green-500" />,
      gray: <CreditCard className="w-5 h-5 text-gray-500" />
    };
    return icons[color as keyof typeof icons];
  };

  const formatPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-900">Sign in to view credits</p>
            <p className="text-xs text-blue-700">Track your usage and manage your subscription</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-3 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!credits || !subscription) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-900">Unable to load credit status</p>
            <p className="text-xs text-red-700">Please refresh the page</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor();
  const percentage = (credits.remaining_credits / credits.total_credits) * 100;

  return (
    <div className={`border rounded-lg p-4 ${
      statusColor === 'red' ? 'bg-red-50 border-red-200' :
      statusColor === 'orange' ? 'bg-orange-50 border-orange-200' :
      statusColor === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
      'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">
                {credits.remaining_credits} credits remaining
              </p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                subscription.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                subscription.plan === 'starter' ? 'bg-blue-100 text-blue-700' :
                subscription.plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {formatPlanName(subscription.plan)} Plan
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {credits.used_credits} used of {credits.total_credits} total
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onBuyCreditsClick && (
            <button
              onClick={onBuyCreditsClick}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Buy Credits</span>
            </button>
          )}
          
          {onUpgradeClick && subscription.plan === 'free' && (
            <button
              onClick={onUpgradeClick}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Upgrade</span>
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Usage</span>
            <span>{percentage.toFixed(0)}% remaining</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                statusColor === 'red' ? 'bg-red-500' :
                statusColor === 'orange' ? 'bg-orange-500' :
                statusColor === 'yellow' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          
          {percentage <= 25 && (
            <div className={`mt-2 p-2 rounded text-xs ${
              statusColor === 'red' ? 'bg-red-100 text-red-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              <p className="font-medium">
                {percentage <= 10 ? 'Critical: ' : 'Warning: '}
                Low credit balance
              </p>
              <p>
                {subscription.plan === 'free' 
                  ? 'Consider upgrading your plan for more credits.'
                  : 'Consider purchasing additional credits.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditStatus;
