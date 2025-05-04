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
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo and hotel name removed as requested */}
          </div>
          <div className="hidden md:flex items-center w-full justify-end gap-6">
            <Link href="/call-history">
              <a className="px-3 py-1 rounded bg-primary-dark text-white text-sm flex items-center">
                <History className="w-4 h-4 mr-1" />
                Call History
              </a>
            </Link>
            <div className="flex-1 flex justify-center">
              <InfographicSteps horizontal currentStep={1} />
            </div>
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
