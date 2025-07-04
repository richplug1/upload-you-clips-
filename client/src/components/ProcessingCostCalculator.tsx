import React, { useState, useEffect } from 'react';
import { Calculator, Clock, Zap, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { subscriptionService } from '../services/subscription';
import { videoService } from '../services/videoService';

interface ProcessingCostCalculatorProps {
  videoDuration: number;
  clipsCount: number;
  onCostCalculated?: (cost: number, canProcess: boolean) => void;
  showDetails?: boolean;
}

const ProcessingCostCalculator: React.FC<ProcessingCostCalculatorProps> = ({
  videoDuration,
  clipsCount,
  onCostCalculated,
  showDetails = true
}) => {
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [canProcess, setCanProcess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoDuration > 0 && clipsCount > 0) {
      calculateCost();
    }
  }, [videoDuration, clipsCount]);

  const calculateCost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get cost breakdown
      const costData = await subscriptionService.calculateProcessingCost(videoDuration, clipsCount);
      setCostBreakdown(costData);

      // Get user status
      const status = await subscriptionService.getSubscriptionStatus();
      setUserStatus(status);

      // Check if user can process
      const processingCheck = await videoService.checkProcessingCost(videoDuration, clipsCount);
      setCanProcess(processingCheck.canProcess);

      if (onCostCalculated) {
        onCostCalculated(costData.cost_breakdown.total_credits, processingCheck.canProcess);
      }

    } catch (err: any) {
      setError(err.message);
      setCanProcess(false);
      if (onCostCalculated) {
        onCostCalculated(0, false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin">
            <Calculator className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Calculating processing cost...</p>
            <p className="text-xs text-gray-500">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-900">Cost calculation failed</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!costBreakdown || !userStatus) {
    return null;
  }

  const { cost_breakdown, video_info } = costBreakdown;
  const { subscription, credits } = userStatus;

  return (
    <div className={`border rounded-lg p-4 ${
      canProcess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calculator className={`w-5 h-5 ${canProcess ? 'text-green-600' : 'text-red-600'}`} />
          <h3 className="text-sm font-semibold text-gray-900">Processing Cost</h3>
        </div>
        <div className="flex items-center space-x-2">
          {canProcess ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-bold ${canProcess ? 'text-green-700' : 'text-red-700'}`}>
            {cost_breakdown.total_credits} credits
          </span>
        </div>
      </div>

      {/* Video Info */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Duration: {formatDuration(video_info.duration_seconds)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Clips: {video_info.clips_requested}</span>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Cost Breakdown */}
          <div className="bg-white rounded-md p-3 mb-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Cost Breakdown</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Base cost ({clipsCount} clips × 1 credit):</span>
                <span className="font-medium">{cost_breakdown.base_cost} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration bonus ({video_info.duration_minutes} min × 0.1):</span>
                <span className="font-medium">{cost_breakdown.duration_cost.toFixed(1)} credits</span>
              </div>
              {cost_breakdown.complexity_bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Complexity bonus (10+ minutes):</span>
                  <span className="font-medium">{cost_breakdown.complexity_bonus} credits</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span>{cost_breakdown.total_credits} credits</span>
              </div>
            </div>
          </div>

          {/* User Status */}
          <div className="bg-white rounded-md p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Your Account</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-medium capitalize">{subscription.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available Credits:</span>
                <span className="font-medium">{credits.remaining_credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">After Processing:</span>
                <span className={`font-medium ${
                  credits.remaining_credits - cost_breakdown.total_credits >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {credits.remaining_credits - cost_breakdown.total_credits} credits
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Status Message */}
      <div className={`mt-3 p-2 rounded text-xs ${
        canProcess 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {canProcess ? (
          <div>
            <p className="font-medium">✓ Ready to process</p>
            <p>You have sufficient credits to process this video.</p>
          </div>
        ) : (
          <div>
            <p className="font-medium">⚠ Cannot process</p>
            <p>
              {credits.remaining_credits < cost_breakdown.total_credits
                ? `You need ${cost_breakdown.total_credits - credits.remaining_credits} more credits.`
                : 'Processing limits exceeded for your current plan.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingCostCalculator;
