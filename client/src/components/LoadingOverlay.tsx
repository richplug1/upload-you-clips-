import { useState, useEffect } from 'react';
import { Loader2, Film, Scissors, Sparkles, CheckCircle } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay = ({ message = 'Processing...' }: LoadingOverlayProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Film, label: 'Analyzing video content', color: 'from-blue-400 to-blue-600' },
    { icon: Scissors, label: 'Identifying key moments', color: 'from-green-400 to-green-600' },
    { icon: Sparkles, label: 'Generating clips with AI', color: 'from-purple-400 to-purple-600' },
    { icon: CheckCircle, label: 'Finalizing results', color: 'from-emerald-400 to-emerald-600' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 3;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  const CurrentStepIcon = steps[currentStep]?.icon || Loader2;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-slide-up">
        {/* Main Content */}
        <div className="text-center">
          {/* Animated Icon */}
          <div className="relative mb-6">
            <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${steps[currentStep]?.color || 'from-blue-400 to-blue-600'} rounded-2xl flex items-center justify-center shadow-lg animate-bounce-gentle`}>
              <CurrentStepIcon className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
              <span className="text-lg">✨</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{message}</h3>
            <p className="text-gray-600 text-sm">{steps[currentStep]?.label}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index <= currentStep
                      ? `bg-gradient-to-br ${step.color} text-white shadow-md`
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                </div>
              );
            })}
          </div>

          {/* Fun Facts */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <p className="text-sm text-gray-600">
              💡 <span className="font-medium">Did you know?</span> AI analyzes thousands of data points to create the perfect clips for social media engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
