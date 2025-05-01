import React, { useRef, useEffect, useState } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Reference from './Reference';
import SiriCallButton from './SiriCallButton';
import { referenceService, ReferenceItem } from '@/services/ReferenceService';
import { Transcript } from '@/types';

interface Interface2Props {
  isActive: boolean;
}

// Define sentence end markers
const sentenceEndMarkers = ['.', '!', '?', '。', '！', '?', ' ', '\n\n'];

const Interface2: React.FC<Interface2Props> = ({ isActive }) => {
  const { 
    transcripts, 
    callDetails,
    callDuration,
    endCall: contextEndCall,
    isMuted,
    toggleMute,
    setCurrentInterface,
    micLevel,
    modelOutput,
    addModelOutput
  } = useAssistant();
  
  // Add state for references and temporary buffer
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [temporaryBuffer, setTemporaryBuffer] = useState('');
  const [fullBuffer, setFullBuffer] = useState('');
  
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

  // Update temporary buffer when new model output arrives
  useEffect(() => {
    if (modelOutput && modelOutput.length > 0) {
      const latestOutput = modelOutput[modelOutput.length - 1];
      
      // Skip system messages and typing indicators
      if (latestOutput.includes('(Typing...)') || 
          latestOutput.includes('support_agent') ||
          latestOutput.includes('_agent') ||
          latestOutput.includes('helptodayyouduringyourstayMi') ||
          latestOutput.includes('(Real-time)person') ||
          latestOutput === '!?' ||
          latestOutput === '""' ||
          latestOutput.trim().length === 0) {
        console.log('Skipping system message:', latestOutput);
        return;
      }
      
      console.log('Processing new model output:', latestOutput);
      
      // Clean the output before adding to buffer
      const cleanedOutput = latestOutput
        // Remove all system message patterns
        .replace(/\(Typing\.\.\.\).*?support_agentAssistant/g, '')
        .replace(/helptodayyouduringyourstayMi\??/g, '')
        .replace(/support_agentAssistant\s*\(Real-time\)person.*?How are you doing\??/g, '')
        .replace(/\(Typing\.\.\.\)/g, '')
        .replace(/support_agent/g, '')
        .replace(/_agent/g, '')
        .replace(/YouHi\./g, '')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (!cleanedOutput || 
          cleanedOutput === '!?' || 
          cleanedOutput === '""' ||
          cleanedOutput.includes('support_agent') ||
          cleanedOutput.includes('(Real-time)')) {
        console.log('Skipping empty or system output after cleaning');
        return;
      }
      
      setTemporaryBuffer(prev => {
        // Don't add if it's just a repeat of the last content
        if (prev.endsWith(cleanedOutput)) {
          return prev;
        }
        
        // Don't add if it's just system messages
        if (cleanedOutput.match(/^[!?""]*$/)) {
          return prev;
        }
        
        const newBuffer = prev + cleanedOutput;
        console.log('New temporary buffer:', newBuffer);
        return newBuffer;
      });
    }
  }, [modelOutput]);

  // Process complete sentences
  useEffect(() => {
    if (!temporaryBuffer) return;

    console.log('Processing temporary buffer:', temporaryBuffer);
    let lastSentenceEndIndex = -1;
    
    for (const marker of sentenceEndMarkers) {
      const index = temporaryBuffer.lastIndexOf(marker);
      if (index > lastSentenceEndIndex) {
        lastSentenceEndIndex = index;
      }
    }

    if (lastSentenceEndIndex !== -1) {
      const completeSentence = temporaryBuffer.substring(0, lastSentenceEndIndex + 1).trim();
      
      // Skip if sentence contains system messages
      if (completeSentence.split(' ').every(word => word === 'you') ||
          completeSentence.includes('(Typing...)') ||
          completeSentence.includes('support_agent') ||
          completeSentence.includes('_agent') ||
          completeSentence.includes('helptodayyouduringyourstayMi') ||
          completeSentence.includes('(Real-time)person') ||
          completeSentence.match(/^[!?""]*$/)) {
        setTemporaryBuffer('');
        return;
      }
      
      console.log('Found complete sentence:', completeSentence);
      
      setFullBuffer(prev => {
        // Don't add if it's just a repeat
        if (prev.endsWith(completeSentence)) {
          return prev;
        }
        const newBuffer = prev + completeSentence + ' ';
        console.log('Updated full buffer:', newBuffer);
        return newBuffer;
      });

      // Only add non-empty, non-system messages to model output
      if (completeSentence.trim() && 
          !completeSentence.includes('support_agent') &&
          !completeSentence.includes('(Real-time)')) {
        addModelOutput(completeSentence);
      }
      
      // Clear processed content from temporary buffer
      setTemporaryBuffer(temporaryBuffer.substring(lastSentenceEndIndex + 1).trim());
    }
  }, [temporaryBuffer]);
  
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
  
  // Scroll to bottom of conversation when new messages arrive
  useEffect(() => {
    if (conversationRef.current && isActive) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [transcripts, isActive, temporaryBuffer]);
  
  useEffect(() => {
    console.log("Tất cả container có thể:", document.querySelectorAll('*[class*="conversation"]'));
  }, []);
  
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
          {/* Replace old orb with new SiriCallButton */}
          <div className="relative flex items-center justify-center">
            <SiriCallButton
              containerId="siri-button"
              isListening={!isMuted}
              volumeLevel={micLevel}
            />
            <div className="absolute bottom-[-30px] text-white text-sm">
              {formatDuration(localDuration)}
            </div>
          </div>
          
          {/* Realtime conversation container spans full width */}
          <div
            id="realTimeConversation"
            ref={conversationRef}
            className="relative p-2 w-full min-h-[60px] max-h-[128px] overflow-y-auto realtime-conversation-container"
          >
            {/* Display transcripts in chronological order */}
            {transcripts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).map((item) => (
              <div key={item.id} className="mb-2">
                <div className="flex items-start mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="material-icons text-sm">
                      {item.role === 'user' ? 'person' : 'support_agent'}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs mb-0.5 text-gray-400">
                      {item.role === 'user' ? 'You' : `Assistant${item.isModelOutput ? ' (Real-time)' : ''}`}
                    </p>
                    <p className={`text-base font-normal ${
                      item.role === 'user' ? 'text-blue-300' : 'text-yellow-100'
                    }`}>
                      {item.content || '...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Show temporary buffer if exists */}
            {temporaryBuffer && (
              <div className="mb-2">
                <div className="flex items-start mb-1">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="material-icons text-sm">support_agent</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs mb-0.5 text-gray-400">Assistant (Typing...)</p>
                    <p className="text-base font-normal text-yellow-100">{temporaryBuffer}</p>
                  </div>
                </div>
              </div>
            )}
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
          <button id="cancelButton" onClick={() => {
            endCall();
            setCurrentInterface('interface1');
          }} className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs">
            <span className="material-icons mr-1 text-base">cancel</span>Cancel
          </button>
          <button id="endCallButton" onClick={endCall} className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs">
            <span className="material-icons mr-1 text-base">navigate_next</span>Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Interface2;
