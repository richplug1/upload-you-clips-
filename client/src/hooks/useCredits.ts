import { useState, useEffect } from 'react';
import { subscriptionService, UserSubscription, UserCredits } from '../services/subscription';
import { useAuth } from '../contexts/AuthContext';

interface UseCreditsReturn {
  subscription: UserSubscription | null;
  credits: UserCredits | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  canProcess: (videoDuration: number, clipsCount: number) => {
    canProcess: boolean;
    reason?: string;
    suggestion?: string;
  };
}

export const useCredits = (): UseCreditsReturn => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchCreditsData = async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscription(status.subscription);
      setCredits(status.credits);
    } catch (err: any) {
      setError(err.message || 'Failed to load credits');
      console.error('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditsData();
  }, [isAuthenticated]);

  const canProcess = (videoDuration: number, clipsCount: number) => {
    if (!subscription || !credits) {
      return {
        canProcess: false,
        reason: 'Unable to load subscription status'
      };
    }

    return subscriptionService.canProcessVideo(subscription, videoDuration, clipsCount);
  };

  const refetch = async () => {
    await fetchCreditsData();
  };

  return {
    subscription,
    credits,
    loading,
    error,
    refetch,
    canProcess
  };
};

// Custom hook for checking processing costs
export const useProcessingCost = (videoDuration: number, clipsCount: number) => {
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateCost = async () => {
    if (videoDuration <= 0 || clipsCount <= 0) {
      setCostData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const cost = await subscriptionService.calculateProcessingCost(videoDuration, clipsCount);
      setCostData(cost);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate cost');
      console.error('Error calculating cost:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateCost();
  }, [videoDuration, clipsCount]);

  return {
    costData,
    loading,
    error,
    recalculate: calculateCost
  };
};

// Custom hook for subscription management
export const useSubscription = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const plansData = await subscriptionService.getSubscriptionPlans();
      setPlans(plansData);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const upgradePlan = async (planId: string, paymentMethod?: any) => {
    try {
      const result = await subscriptionService.upgradeSubscription(planId, paymentMethod);
      return result;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to upgrade subscription');
    }
  };

  const purchaseCredits = async (amount: number, paymentMethod: any) => {
    try {
      const result = await subscriptionService.purchaseCredits(amount, paymentMethod);
      return result;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to purchase credits');
    }
  };

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    upgradePlan,
    purchaseCredits
  };
};
