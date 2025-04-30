import React, { useRef, useEffect, useState } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Reference from './Reference';
import { referenceService, ReferenceItem } from '@/services/ReferenceService';

interface Interface2Props {
  isActive: boolean;
}

const Interface2: React.FC<Interface2Props> = ({ isActive }) => {
  const { 
    transcripts, 
    callDetails,
    callDuration,
    endCall: contextEndCall,
    isMuted,
    toggleMute,
    setCurrentInterface,
    micLevel
  } = useAssistant();
  
  // Add state for references
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  
  // Initialize reference service
  useEffect(() => {
    referenceService.initialize();
  }, []);
  
  // Update references when new transcripts arrive
  useEffect(() => {
    // Only look at user messages for reference requests
    const userMessages = transcripts.filter(t => t.role === 'user');
    const matches: ReferenceItem[] = [];
    userMessages.forEach(msg => {
      const found = referenceService.findReferences(msg.content);
      found.forEach(ref => {
        if (!matches.find(m => m.url === ref.url)) {
          matches.push(ref);
        }
      });
    });
    setReferences(matches);
  }, [transcripts]);
  
  // Wrapper for endCall to include local duration if needed
  const endCall = () => {
    // Capture the current duration for the email
    const finalDuration = callDuration > 0 ? callDuration : localDuration;
    console.log('Ending call with duration:', finalDuration);
    
    // Pass the final duration to context's endCall
    contextEndCall();
  };
  
  // Local duration state for backup timer functionality
  const [localDuration, setLocalDuration] = useState(0);
  
  const conversationRef = useRef<HTMLDivElement>(null);
  
  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };
  
  // Local timer as a backup to ensure we always have a working timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    // Only start the timer when this interface is active
    if (isActive) {
      console.log('Interface2 is active, starting local timer');
      // Initialize with the current duration from context
      setLocalDuration(callDuration || 0);
      
      // Start the local timer
      timer = setInterval(() => {
        setLocalDuration(prev => {
          const newDuration = prev + 1;
          console.log('Local call duration updated:', newDuration);
          return newDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) {
        console.log('Cleaning up local timer in Interface2');
        clearInterval(timer);
      }
    };
  }, [isActive, callDuration]);
  
  // Scroll to top of conversation when new messages arrive
  useEffect(() => {
    if (conversationRef.current && isActive) {
      conversationRef.current.scrollTop = 0;
    }
  }, [transcripts, isActive]);
  
  return (
    <div 
      className={`absolute w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-20`} id="interface2"
      style={{
        backgroundImage: "linear-gradient(rgba(26, 35, 126, 0.8), rgba(63, 81, 181, 0.8)), url('/assets/courtyard.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto flex flex-row p-2 h-full gap-2">
        {/* Left: Call indicator & Realtime conversation side by side, Reference below */}
        <div className="w-3/4 lg:w-2/3 flex flex-col items-center space-y-4">
          {/* Siri orb style ring animation */}
          <div className="relative w-[240px] h-[240px] mt-[10px] mb-4">
            {/* Gradient border orb with siri-orb animation */}
            <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-green-500 animate-siri-orb"></div>
            {/* Center button */}
            <button
              id="inCallButton"
              disabled
              style={{ transform: `scale(${1 + micLevel * 0.1})` }}
              className="relative w-full h-full bg-[#ffffff20] text-white rounded-full flex flex-col items-center justify-center text-sm"
            >
              <span className="text-4xl mb-2">●</span>
              <span>Listening...</span>
            </button>
            {/* Time display centered at bottom of call indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
              <span className="text-lg font-bold">{formatDuration(localDuration)}</span>
            </div>
          </div>
          {/* Realtime conversation container spans full width */}
          <div
            id="realTimeConversation"
            ref={conversationRef}
            className="relative p-2 w-full min-h-[60px] max-h-[128px] overflow-y-auto"
          >
            {[...transcripts].reverse().map((transcript) => (
              <div key={transcript.id} className="mb-2">
                <div className="flex items-start mb-1">
                  <div className={`w-8 h-8 rounded-full ${
                    transcript.role === 'assistant' ? 'bg-primary text-white' : 'bg-amber-400 text-primary-dark'
                  } flex items-center justify-center mr-2 flex-shrink-0`}>
                    <span className="material-icons text-base">
                      {transcript.role === 'assistant' ? 'support_agent' : 'person'}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className={`text-sm mb-1 ${transcript.role === 'assistant' ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {transcript.role === 'assistant' ? 'Assistant' : 'You'}
                    </p>
                    <p className={`text-xl font-semibold ${transcript.role === 'assistant' ? 'text-yellow-200' : 'text-blue-200'}`}>{transcript.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Reference container below (full width, auto height) */}
          <div className="w-full">
            <Reference references={references} />
          </div>
        </div>
        {/* Right: Control buttons */}
        <div className="w-1/4 lg:w-1/3 flex flex-col items-center lg:items-end p-2 space-y-2 overflow-auto" style={{ maxHeight: '100%' }}>
          <button id="backButton" onClick={() => setCurrentInterface('interface1')} className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs">
            <span className="material-icons mr-1 text-base">arrow_back</span>Back
          </button>
          <button id="cancelButton" onClick={() => setCurrentInterface('interface1')} className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs">
            <span className="material-icons mr-1 text-base">cancel</span>Cancel
          </button>
          <button id="endCallButton" onClick={endCall} className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs">
            <span className="material-icons mr-1 text-base">call_end</span>End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default Interface2;
