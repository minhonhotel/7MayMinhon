import React from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Interface1 from './Interface1';
import Interface2 from './Interface2';
import Interface3 from './Interface3';
import Interface3Vi from './Interface3Vi';
import Interface4 from './Interface4';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Link } from 'wouter';
import { History } from 'lucide-react';
import InfographicSteps from './InfographicSteps';

const VoiceAssistant: React.FC = () => {
  const { currentInterface } = useAssistant();
  
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="relative h-screen overflow-hidden font-sans text-gray-800 bg-neutral-50" id="app">
      {/* Header Bar */}
      <header className="w-full bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between px-2">
          {/* Left: Logo */}
          <div className="w-16 flex-shrink-0 flex items-center justify-start ml-1 sm:ml-4 mr-2 sm:mr-6">
            <img src="/assets/references/images/minhon-logo.jpg" alt="Minhon Logo" className="h-10 sm:h-14 w-auto rounded-lg shadow-md bg-white/80 p-1" />
          </div>
          {/* Center: InfographicSteps - luôn ngang, nhỏ lại trên mobile */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-xs sm:max-w-md">
              <InfographicSteps horizontal compact currentStep={
                currentInterface === 'interface3' ? 3 :
                currentInterface === 'interface2' ? 2 : 1
              } />
            </div>
          </div>
          {/* Right: Call History */}
          <div className="w-10 flex-shrink-0 flex items-center justify-end ml-2 sm:ml-6 mr-1 sm:mr-2">
            <Link href="/call-history">
              <a className="flex items-center gap-1 px-2 py-1 rounded bg-primary-dark text-white text-xs sm:text-sm">
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Call History</span>
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Interface Layers Container */}
      <div className="relative w-full h-full" id="interfaceContainer">
        <Interface1 
          isActive={currentInterface === 'interface1'} 
        />
        <Interface2 
          isActive={currentInterface === 'interface2'} 
        />
        <Interface3 
          isActive={currentInterface === 'interface3'} 
        />
        <Interface3Vi 
          isActive={currentInterface === 'interface3vi'} 
        />
        <Interface4 
          isActive={currentInterface === 'interface4'} 
        />
      </div>
    </div>
  );
};

export default VoiceAssistant;
