import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Reference from './Reference';
import SiriCallButton from './SiriCallButton';
import { referenceService, ReferenceItem } from '@/services/ReferenceService';

interface Interface2Props {
  isActive: boolean;
}

// Interface cho trạng thái hiển thị của mỗi message
interface VisibleCharState {
  [messageId: string]: number;
}

// Interface cho một turn trong cuộc hội thoại
interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  messages: Array<{
    id: string;
    content: string;
    timestamp: Date;
  }>;
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
    micLevel,
    modelOutput
  } = useAssistant();
  
  // State cho Paint-on effect
  const [visibleChars, setVisibleChars] = useState<VisibleCharState>({});
  const animationFrames = useRef<{[key: string]: number}>({});
  
  // State để lưu trữ các turns đã được xử lý
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  
  // Add state for references
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  
  // Local duration state for backup timer functionality
  const [localDuration, setLocalDuration] = useState(0);
  
  const conversationRef = useRef<HTMLDivElement>(null);

  // Cleanup function for animations
  const cleanupAnimations = () => {
    Object.values(animationFrames.current).forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    animationFrames.current = {};
  };
  
  // Load all references on mount
  useEffect(() => {
    async function loadAllReferences() {
      await referenceService.initialize();
      // Lấy toàn bộ referenceMap
      const allRefs = Object.values((referenceService as any).referenceMap || {}) as ReferenceItem[];
      console.log('All references loaded:', allRefs);
      setReferences(allRefs);
    }
    loadAllReferences();
  }, []);
  
  // Process transcripts into conversation turns
  useEffect(() => {
    const sortedTranscripts = [...transcripts].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    const turns: ConversationTurn[] = [];
    let currentTurn: ConversationTurn | null = null;

    sortedTranscripts.forEach((message) => {
      if (message.role === 'user') {
        // Always create a new turn for user messages
        currentTurn = {
          id: message.id.toString(),
          role: 'user',
          timestamp: message.timestamp,
          messages: [{ 
            id: message.id.toString(), 
            content: message.content,
            timestamp: message.timestamp 
          }]
        };
        turns.push(currentTurn);
      } else {
        // For assistant messages
        if (!currentTurn || currentTurn.role === 'user') {
          // Start new assistant turn
          currentTurn = {
            id: message.id.toString(),
            role: 'assistant',
            timestamp: message.timestamp,
            messages: []
          };
          turns.push(currentTurn);
        }
        // Add message to current assistant turn
        currentTurn.messages.push({
          id: message.id.toString(),
          content: message.content,
          timestamp: message.timestamp
        });
      }
    });

    setConversationTurns(turns);
  }, [transcripts]);

  // Paint-on animation effect
  useEffect(() => {
    // Get all assistant messages from all turns
    const assistantMessages = conversationTurns
      .filter(turn => turn.role === 'assistant')
      .flatMap(turn => turn.messages);
    
    assistantMessages.forEach(message => {
      // Skip if already animated
      if (visibleChars[message.id] === message.content.length) return;
      
      let currentChar = visibleChars[message.id] || 0;
      const content = message.content;
      
      const animate = () => {
        if (currentChar < content.length) {
          setVisibleChars(prev => ({
            ...prev,
            [message.id]: currentChar + 1
          }));
          currentChar++;
          animationFrames.current[message.id] = requestAnimationFrame(animate);
        } else {
          delete animationFrames.current[message.id];
        }
      };
      
      animationFrames.current[message.id] = requestAnimationFrame(animate);
    });
    
    // Cleanup on unmount or when turns change
    return () => cleanupAnimations();
  }, [conversationTurns]);

  // Handler for Cancel button - End call and go back to interface1
  const handleCancel = useCallback(() => {
    // Capture the current duration for the email
    const finalDuration = callDuration > 0 ? callDuration : localDuration;
    console.log('Canceling call with duration:', finalDuration);
    
    // Call the context's endCall and switch to interface1
    contextEndCall();
    setCurrentInterface('interface1');
  }, [callDuration, localDuration, contextEndCall, setCurrentInterface]);

  // Handler for Next button - End call and proceed to interface3
  const handleNext = useCallback(() => {
    // Capture the current duration for the email
    const finalDuration = callDuration > 0 ? callDuration : localDuration;
    console.log('Ending call with duration:', finalDuration);
    
    // Call the context's endCall and switch to interface3
    contextEndCall();
    setCurrentInterface('interface3');
  }, [callDuration, localDuration, contextEndCall, setCurrentInterface]);
  
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
        setLocalDuration(prev => prev + 1);
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
  }, [conversationTurns, isActive]);
  
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
        <div className="w-3/4 lg:w-2/3 flex flex-col items-center space-y-4 mt-2">
          {/* Replace old orb with new SiriCallButton */}
          <div className="relative flex items-center justify-center mb-6">
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
            className="relative w-full max-w-2xl mx-auto min-h-[60px] max-h-[40vh] overflow-y-auto mt-4 mb-2"
            style={{
              background: 'rgba(255,255,255,0.88)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
              padding: '18px',
              marginTop: 16,
              marginBottom: 8,
              transition: 'box-shadow 0.3s, background 0.3s',
              fontFamily: 'SF Pro Text, Roboto, Open Sans, Arial, sans-serif',
              fontSize: window.innerWidth < 640 ? 15 : 17,
              lineHeight: 1.5,
              color: '#222',
              fontWeight: 400,
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            {/* Nút đóng transcript (optional) */}
            <button
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-gray-700 shadow-md z-10"
              style={{fontSize: 18, display: 'block'}}
              title="Đóng transcript"
              onClick={() => setCurrentInterface('interface1')}
            >
              <span className="material-icons">close</span>
            </button>
            {/* Display conversation turns */}
            <div className="w-full flex flex-col gap-2 pr-2" style={{overflowY: 'auto', maxHeight: '28vh'}}>
              {conversationTurns.length === 0 && (
                <div className="text-gray-400 text-base text-center select-none" style={{opacity: 0.7}}>
                  Tap to speak or start a conversation...
                </div>
              )}
              {conversationTurns.map((turn, turnIdx) => (
                <div key={turn.id} className="mb-1">
                  <div className="flex items-start">
                    <div className="flex-grow">
                      {turn.role === 'user' ? (
                        <p className="text-base md:text-lg font-medium text-gray-900" style={{marginBottom: 2}}>
                          {turn.messages[0].content}
                        </p>
                      ) : (
                        <p className="text-base md:text-lg font-medium text-[#333333]" style={{marginBottom: 2, position: 'relative'}}>
                          <span className="inline-flex flex-wrap">
                            {turn.messages.map((msg, idx) => {
                              const content = msg.content.slice(0, visibleChars[msg.id] || 0);
                              return (
                                <span key={msg.id} style={{ whiteSpace: 'pre' }}>
                                  {content}
                                  {/* Blinking cursor cho từ cuối cùng khi đang xử lý */}
                                  {idx === turn.messages.length - 1 && turnIdx === conversationTurns.length - 1 && visibleChars[msg.id] < msg.content.length && (
                                    <span className="animate-blink text-yellow-500" style={{marginLeft: 1}}>|</span>
                                  )}
                                </span>
                              );
                            })}
                          </span>
                          {/* 3 chấm nhấp nháy khi assistant đang nghe */}
                          {turnIdx === conversationTurns.length - 1 && turn.role === 'assistant' && visibleChars[turn.messages[turn.messages.length-1].id] === turn.messages[turn.messages.length-1].content.length && (
                            <span className="ml-2 animate-ellipsis text-yellow-500">...</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Reference container below (full width, auto height) */}
          <div className="w-full mt-4">
            <Reference references={references} />
          </div>
        </div>
        {/* Right: Control buttons */}
        <div className="w-1/4 lg:w-1/3 flex flex-col items-center lg:items-end p-2 space-y-2 overflow-auto" style={{ maxHeight: '100%' }}>
          <button id="backButton" onClick={() => setCurrentInterface('interface1')} className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs">
            <span className="material-icons mr-1 text-base">arrow_back</span>Back
          </button>
          <button id="cancelButton" onClick={handleCancel} className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs">
            <span className="material-icons mr-1 text-base">cancel</span>Cancel
          </button>
          <div className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 rounded-lg text-xs bg-[#d4af37] hover:bg-[#bfa133]" style={{ background: '#d4af37' }}>
            <button id="endCallButton" onClick={handleNext} className="flex items-center justify-center text-white font-semibold gap-2 w-full">
              <span className="material-icons text-base">navigate_next</span>
              <span>Confirm Your Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface2;
