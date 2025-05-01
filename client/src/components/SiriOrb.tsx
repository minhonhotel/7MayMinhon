import React, { useEffect, useRef } from 'react';
import '@/styles/siri-orb.css';

interface SiriOrbProps {
  micLevel: number;
  duration: string;
}

const SiriOrb: React.FC<SiriOrbProps> = ({ micLevel, duration }) => {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orbRef.current) {
      // Scale the orb based on mic level
      const scale = 1 + Math.min(micLevel * 0.3, 0.3); // Cap the scale at 1.3x
      orbRef.current.style.transform = `scale(${scale})`;
    }
  }, [micLevel]);

  return (
    <div className="relative w-[240px] h-[240px] mt-[10px] mb-4">
      {/* Wave animations */}
      <div className="siri-wave siri-wave-1"></div>
      <div className="siri-wave siri-wave-2"></div>
      <div className="siri-wave siri-wave-3"></div>
      
      {/* Main orb */}
      <div ref={orbRef} className="siri-orb">
        <div className="siri-content">
          <div className="siri-listening-dot"></div>
          <span className="siri-text">Listening...</span>
        </div>
      </div>

      {/* Duration display */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
        <span className="text-lg font-bold">{duration}</span>
      </div>
    </div>
  );
};

export default SiriOrb; 