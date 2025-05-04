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

export default function InfographicSteps({ currentStep = 1, compact = false, horizontal = false }) {
  if (horizontal) {
    return (
      <div className="flex flex-row items-center justify-center w-full gap-2 md:gap-6 py-1">
        {steps.map((step, idx) => (
          <React.Fragment key={step.title}>
            <div
              className={`flex flex-col items-center transition-all duration-300 ${
                idx + 1 === currentStep
                  ? 'opacity-100 scale-105'
                  : idx + 1 < currentStep
                  ? 'opacity-60'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-full shadow-lg mb-0.5 transition-all duration-300 ${
                  idx + 1 === currentStep
                    ? 'bg-[#d4af37] text-blue-900 border-2 border-[#d4af37]'
                    : 'bg-white/30 text-white border border-gray-200'
                }`}
                style={{
                  width: 22,
                  height: 22,
                  fontSize: 13,
                }}
              >
                <span className="material-icons">{step.icon}</span>
              </div>
              <div className="text-center">
                <div className={`font-semibold font-poppins mb-0 text-[10px] ${idx + 1 === currentStep ? 'text-white' : 'text-white/70'}`}>{step.title}</div>
                <div className="font-light text-[8px] text-white/80 hidden md:block">{step.desc}</div>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="h-0.5 w-3 md:w-8 bg-gradient-to-r from-[#d4af37]/80 to-transparent mx-1 rounded-full" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
  // Dọc như cũ
  return (
    <div
      className={`w-full ${compact ? 'max-w-[160px] py-2 gap-3' : 'max-w-xs py-6 gap-6'} mx-auto flex flex-col items-center`}
    >
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
                : 'bg-white/30 text-white border border-gray-200'
            }`}
            style={{
              width: compact ? 32 : 48,
              height: compact ? 32 : 48,
              fontSize: compact ? 18 : 28,
            }}
          >
            <span className="material-icons">{step.icon}</span>
          </div>
          <div className="text-center">
            <div
              className={`font-semibold font-poppins mb-1 ${compact ? 'text-xs' : 'text-base'} ${
                idx + 1 === currentStep ? 'text-white' : 'text-white/70'
              }`}
            >
              {step.title}
            </div>
            <div className={`font-light ${compact ? 'text-[10px]' : 'text-sm'} text-white/80`}>{step.desc}</div>
          </div>
          {idx < steps.length - 1 && (
            <div className={`mx-auto my-1 rounded-full ${compact ? 'w-0.5 h-4' : 'w-1 h-8'} bg-gradient-to-b from-[#d4af37]/80 to-transparent`} />
          )}
        </div>
      ))}
    </div>
  );
} 