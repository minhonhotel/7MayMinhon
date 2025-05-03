import React, { useEffect, useRef } from 'react';
import { SiriButton } from './SiriButton';

interface SiriCallButtonProps {
  isListening: boolean;
  volumeLevel: number;
  containerId: string;
  sizeMultiplier?: number;
}

const SiriCallButton: React.FC<SiriCallButtonProps> = ({ 
  isListening, 
  volumeLevel,
  containerId,
  sizeMultiplier = 1
}) => {
  const buttonRef = useRef<SiriButton | null>(null);

  useEffect(() => {
    // Initialize SiriButton
    buttonRef.current = new SiriButton(containerId);

    // Cleanup on unmount
    return () => {
      if (buttonRef.current) {
        buttonRef.current.cleanup();
        buttonRef.current = null;
      }
    };
  }, [containerId]);

  useEffect(() => {
    // Update listening state
    if (buttonRef.current) {
      buttonRef.current.setListening(isListening);
    }
  }, [isListening]);

  useEffect(() => {
    // Update volume level
    if (buttonRef.current) {
      buttonRef.current.setVolumeLevel(volumeLevel);
    }
  }, [volumeLevel]);

  return (
    <div 
      id={containerId}
      className="relative"
      style={{ cursor: 'pointer', width: `${8 * sizeMultiplier}rem`, height: `${8 * sizeMultiplier}rem` }}
    />
  );
};

export default SiriCallButton; 