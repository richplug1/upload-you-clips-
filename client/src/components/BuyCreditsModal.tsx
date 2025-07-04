import React, { useState } from 'react';
import { CreditCard, Plus, Zap, Check, AlertCircle } from 'lucide-react';
import { subscriptionService } from '../services/subscription';
import { useToast } from './ToastNotification';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (creditsAdded: number) => void;
  currentCredits?: number;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentCredits = 0
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { success, error } = useToast();

  const creditPackages = [
    {
      id: 'small',
      credits: 50,
      price: 5.00,
      popular: false,
      description: 'Perfect for occasional use'
    },
    {
      id: 'medium',
      credits: 120,
      price: 10.00,
      popular: true,
      description: 'Great value for regular users'
    },
    {
      id: 'large',
      credits: 250,
      price: 20.00,
      popular: false,
      description: 'Best for power users'
    },
    {
      id: 'enterprise',
      credits: 500,
      price: 35.00,
      popular: false,
      description: 'For heavy usage'
    }
  ];

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setCustomAmount(0);
  };

  const handleCustomAmountChange = (amount: number) => {
    setCustomAmount(amount);
    setSelectedPackage('');
  };

  const getSelectedCredits = () => {
    if (selectedPackage) {
      const pkg = creditPackages.find(p => p.id === selectedPackage);
      return pkg ? pkg.credits : 0;
    }
    return customAmount;
  };

  const getSelectedPrice = () => {
    if (selectedPackage) {
      const pkg = creditPackages.find(p => p.id === selectedPackage);
      return pkg ? pkg.price : 0;
    }
    // Custom pricing: $0.10 per credit
    return customAmount * 0.10;
  };

  const handlePurchase = async () => {
    const credits = getSelectedCredits();
    const price = getSelectedPrice();

    if (credits <= 0) {
      error('Please select a credit package or enter a custom amount');
      return;
    }

    try {
      setIsProcessing(true);

      // Simulate payment method (in real app, integrate with Stripe/PayPal)
      const paymentMethod = {
        type: 'demo',
        token: 'demo_payment_token',
        amount: price
      };

      const result = await subscriptionService.purchaseCredits(credits, paymentMethod);
      
      success(`Successfully purchased ${credits} credits!`);
      
      if (onSuccess) {
        onSuccess(credits);
      }
      
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to purchase credits');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Buy Credits</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Current balance: {currentCredits} credits
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Credit Packages */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Credit Package</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPackage === pkg.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-4 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-gray-900">{pkg.credits} credits</span>
                    </div>
                    {selectedPackage === pkg.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${pkg.price.toFixed(2)}
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    ${(pkg.price / pkg.credits).toFixed(3)} per credit
                  </div>
                  
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Or Enter Custom Amount</h3>
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={customAmount || ''}
                    onChange={(e) => handleCustomAmountChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Cost</div>
                  <div className="text-xl font-bold text-gray-900">
                    ${(customAmount * 0.10).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">$0.10 per credit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Summary */}
          {(selectedPackage || customAmount > 0) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Purchase Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Credits to purchase:</span>
                  <span className="font-medium">{getSelectedCredits()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current balance:</span>
                  <span>{currentCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span>New balance:</span>
                  <span className="font-medium text-green-600">
                    {currentCredits + getSelectedCredits()}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Cost:</span>
                  <span>${getSelectedPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Demo Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Demo Mode</p>
                <p className="text-xs text-yellow-700">
                  This is a demonstration. No real payment will be processed.
                  In production, this would integrate with Stripe, PayPal, or other payment providers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={isProcessing || (getSelectedCredits() === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Purchase {getSelectedCredits()} Credits</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyCreditsModal;
