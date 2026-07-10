import React, { useState, useEffect } from 'react';
import { X, Calendar, Video, Wallet, FileText, ArrowRight, Sparkles } from 'lucide-react';

const TOUR_SEEN_KEY = 'nexus_tour_seen';

const steps = [
  {
    icon: <Calendar size={28} className="text-primary-600" />,
    title: 'Schedule Meetings',
    description:
      'Set your availability and send or receive meeting requests with investors and entrepreneurs — all from the Calendar page.',
  },
  {
    icon: <Video size={28} className="text-primary-600" />,
    title: 'Video Calls',
    description:
      'Start a video call directly from the sidebar to connect face-to-face once a meeting is confirmed.',
  },
  {
    icon: <FileText size={28} className="text-primary-600" />,
    title: 'Document Chamber',
    description:
      'Upload, preview, and e-sign deal documents. Track their status from Draft to Signed.',
  },
  {
    icon: <Wallet size={28} className="text-primary-600" />,
    title: 'Payments & Deals',
    description:
      'Deposit, withdraw, transfer funds, or fund a deal directly — with a full transaction history.',
  },
];

export const WelcomeTour: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen) {
      setVisible(true);
    }
  }, []);

  const closeTour = () => {
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
    setVisible(false);
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      closeTour();
    }
  };

  if (!visible) return null;

  const step = steps[stepIndex];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 relative shadow-xl">
        <button
          onClick={closeTour}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close tour"
        >
          <X size={20} />
        </button>

        {stepIndex === 0 && (
          <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-3">
            <Sparkles size={16} />
            Welcome to Business Nexus!
          </div>
        )}

        <div className="p-3 bg-primary-50 rounded-full w-fit mb-4">{step.icon}</div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 mb-6">{step.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? 'w-6 bg-primary-600' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={closeTour} className="text-sm text-gray-500 hover:text-gray-700 px-2">
              Skip
            </button>
            <button
              onClick={handleNext}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1"
            >
              {stepIndex < steps.length - 1 ? 'Next' : 'Get Started'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};