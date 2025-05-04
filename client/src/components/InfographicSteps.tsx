import React from 'react';

const steps = [
  {
    icon: 'call',
    title: 'Press to Call',
    desc: 'Tap the call button to start your request.',
  },
  {
    icon: 'check_circle',
    title: 'Confirm Your Request',
    desc: 'Review and confirm your request for accuracy.',
  },
  {
    icon: 'mail',
    title: 'Send to Reception',
    desc: 'Your request will be sent to the reception for processing.',
  },
];

export default function InfographicSteps({ currentStep = 1 }) {
  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-6 py-6">
      <h3 className="text-xl font-bold text-blue-900 mb-2 tracking-wide font-poppins">Steps to Process Your Request</h3>
      {steps.map((step, idx) => (
        <div
          key={step.title}
          className={`flex flex-col items-center w-full transition-all duration-300 ${
            idx + 1 === currentStep
              ? 'opacity-100 scale-105'
              : idx + 1 < currentStep
              ? 'opacity-60'
              : 'opacity-40'
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-full shadow-lg mb-2 transition-all duration-300 ${
              idx + 1 === currentStep
                ? 'bg-[#d4af37] text-blue-900 border-2 border-[#d4af37]'
                : 'bg-white/80 text-blue-900 border border-gray-200'
            }`}
            style={{
              width: 48,
              height: 48,
              fontSize: 28,
            }}
          >
            <span className="material-icons">{step.icon}</span>
          </div>
          <div className="text-center">
            <div
              className={`font-semibold text-base mb-1 font-poppins ${
                idx + 1 === currentStep ? 'text-blue-900' : 'text-gray-500'
              }`}
            >
              {step.title}
            </div>
            <div className="text-sm text-gray-700 font-light">{step.desc}</div>
          </div>
          {idx < steps.length - 1 && (
            <div className="w-1 h-8 bg-gradient-to-b from-[#d4af37]/80 to-transparent mx-auto my-2 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
} 