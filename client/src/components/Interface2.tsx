import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Reference from './Reference';
import SiriCallButton from './SiriCallButton';
import { referenceService, ReferenceItem } from '@/services/ReferenceService';
import InfographicSteps from './InfographicSteps';

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

  // NEW: State để ẩn/hiện khung realtime conversation
  const [showRealtimeConversation, setShowRealtimeConversation] = useState(true);
  
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
    // Nếu chưa có hội thoại thì không cho xác nhận
    if (!transcripts || transcripts.length === 0) {
      alert('Bạn cần trao đổi với trợ lý trước khi xác nhận yêu cầu!');
      return;
    }
    // Capture the current duration for the email
    const finalDuration = callDuration > 0 ? callDuration : localDuration;
    console.log('Ending call with duration:', finalDuration);
    // Call the context's endCall and switch to interface3
    contextEndCall();
    setCurrentInterface('interface3');
  }, [callDuration, localDuration, contextEndCall, setCurrentInterface, transcripts]);
  
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
  
  // Auto scroll to top when new transcript arrives
  useEffect(() => {
    if (conversationRef.current && isActive) {
      conversationRef.current.scrollTop = 0;
    }
  }, [conversationTurns, isActive]);
  
  return (
    <div 
      className={`absolute w-full min-h-screen h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-20 overflow-y-auto`} id="interface2"
      style={{
        backgroundImage: "linear-gradient(rgba(26, 35, 126, 0.8), rgba(63, 81, 181, 0.8)), url('/assets/courtyard.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto flex flex-col md:flex-row p-2 h-full gap-2">
        {/* Left: Call indicator & Realtime conversation side by side, Reference below */}
        <div className="w-full md:w-3/4 lg:w-2/3 flex flex-col items-center space-y-1 sm:space-y-4 mt-1">
          {/* Replace old orb with new SiriCallButton */}
          <div className="relative flex flex-col items-center justify-center mb-1 sm:mb-6 w-full max-w-xs mx-auto">
            {/* SiriCallButton ở trên */}
            <SiriCallButton
              containerId="siri-button"
              isListening={!isMuted}
              volumeLevel={micLevel}
            />
            {/* Duration bar với các nút hai bên, căn giữa tuyệt đối */}
            <div className="flex items-center justify-center mt-2 w-full gap-2 sm:gap-3">
              {/* Nút Mute bên trái */}
              <button
                className="flex items-center justify-center transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
                onClick={toggleMute}
                style={{fontSize: 22, padding: 0, background: 'none', border: 'none', color: '#d4af37', width: 28, height: 28}}
                onMouseOver={e => (e.currentTarget.style.color = '#ffd700')}
                onMouseOut={e => (e.currentTarget.style.color = '#d4af37')}
              >
                <span className="material-icons">{isMuted ? 'mic_off' : 'mic'}</span>
              </button>
              {/* Nút Cancel (chỉ mobile) */}
              <button
                id="cancelButton"
                onClick={handleCancel}
                className="flex items-center justify-center px-2 py-1 bg-white/80 hover:bg-blue-100 text-blue-900 rounded-full text-xs font-semibold border border-white/30 shadow transition-colors sm:hidden"
                style={{fontFamily:'inherit', letterSpacing:0.2}}
              >
                <span className="material-icons text-base mr-1">cancel</span>Cancel
              </button>
              {/* Duration ở giữa, luôn căn giữa */}
              <div className="flex-1 flex justify-center">
                <div className="text-white text-xs sm:text-sm bg-blue-900/80 rounded-full px-3 sm:px-4 py-1 shadow-lg border border-white/30 flex items-center justify-center" style={{backdropFilter:'blur(2px)'}}>
                  {formatDuration(localDuration)}
                </div>
              </div>
              {/* Nút Confirm (chỉ mobile) */}
              <button
                id="endCallButton"
                onClick={handleNext}
                className="flex items-center justify-center bg-[#d4af37] hover:bg-[#ffd700] text-blue-900 font-bold py-1 px-2 rounded-full shadow-lg transition-colors border border-white/30 text-xs sm:hidden"
                style={{fontFamily:'inherit', letterSpacing:0.5}}
              >
                <span className="material-icons">send</span>
                <span className="whitespace-nowrap ml-1">Confirm</span>
              </button>
              {/* Nút MicLevel bên phải */}
              <button
                className="flex items-center justify-center transition-colors"
                title="Mic Level"
                style={{fontSize: 22, padding: 0, background: 'none', border: 'none', color: '#d4af37', width: 28, height: 28}}
                tabIndex={-1}
                disabled
                onMouseOver={e => (e.currentTarget.style.color = '#ffd700')}
                onMouseOut={e => (e.currentTarget.style.color = '#d4af37')}
              >
                <span className="material-icons">graphic_eq</span>
                <span className="ml-1 flex items-end h-4 w-6">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} style={{
                      display: 'inline-block',
                      width: 2,
                      height: `${4 + Math.round((micLevel/100)*12) * ((i%2)+1)}px`,
                      background: '#d4af37',
                      marginLeft: 1,
                      borderRadius: 1
                    }} />
                  ))}
                </span>
              </button>
            </div>
          </div>
          
          {/* Realtime conversation container spans full width */}
          {showRealtimeConversation && (
            <div
              id="realTimeConversation"
              ref={conversationRef}
              className="w-full flex flex-col-reverse gap-1 pr-2 relative max-w-full sm:max-w-2xl mx-auto min-h-[60px] max-h-[12vh] overflow-y-auto mb-1"
              style={{
                background: 'rgba(255,255,255,0.88)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                padding: '8px',
                transition: 'box-shadow 0.3s, background 0.3s',
                fontFamily: 'SF Pro Text, Roboto, Open Sans, Arial, sans-serif',
                fontSize: window.innerWidth < 640 ? 14 : 16,
                lineHeight: 1.5,
                color: '#222',
                fontWeight: 400,
                backdropFilter: 'blur(2px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              {/* Nút đóng transcript (ẩn realtime conversation) */}
              <button
                className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/70 text-gray-400 hover:text-gray-700 shadow z-10 opacity-60 hover:opacity-90 transition-all"
                style={{fontSize: 14, display: 'block'}}
                title="Ẩn realtime conversation"
                onClick={() => setShowRealtimeConversation(false)}
              >
                <span className="material-icons" style={{fontSize: 16}}>close</span>
              </button>
              {/* Display conversation turns */}
              <div className="w-full flex flex-col gap-1 pr-2" style={{overflowY: 'auto', maxHeight: '28vh'}}>
                {conversationTurns.length === 0 && (
                  <div className="text-gray-400 text-base text-center select-none" style={{opacity: 0.7}}>
                    Tap to speak or start a conversation...
                  </div>
                )}
                {[...conversationTurns].reverse().map((turn, turnIdx) => (
                  <div key={turn.id} className="mb-1">
                    <div className="flex items-start">
                      <div className="flex-grow">
                        {turn.role === 'user' ? (
                          <p className="text-base md:text-lg font-medium text-gray-900" style={{marginBottom: 2}}>
                            {turn.messages[0].content}
                          </p>
                        ) : (
                          <p
                            className="text-base md:text-lg font-medium"
                            style={{
                              marginBottom: 2,
                              position: 'relative',
                              background: 'linear-gradient(90deg, #FF512F, #F09819, #FFD700, #56ab2f, #43cea2, #1e90ff, #6a11cb, #FF512F)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              fontWeight: 600,
                              letterSpacing: 0.2,
                              transition: 'background 0.5s'
                            }}
                          >
                            <span className="inline-flex flex-wrap">
                              {turn.messages.map((msg, idx) => {
                                const content = msg.content.slice(0, visibleChars[msg.id] || 0);
                                return (
                                  <span key={msg.id} style={{ whiteSpace: 'pre' }}>
                                    {content}
                                    {/* Blinking cursor cho từ cuối cùng khi đang xử lý */}
                                    {idx === turn.messages.length - 1 && turnIdx === 0 && visibleChars[msg.id] < msg.content.length && (
                                      <span className="animate-blink text-yellow-500" style={{marginLeft: 1}}>|</span>
                                    )}
                                  </span>
                                );
                              })}
                            </span>
                            {/* 3 chấm nhấp nháy khi assistant đang nghe */}
                            {turnIdx === 0 && turn.role === 'assistant' && visibleChars[turn.messages[turn.messages.length-1].id] === turn.messages[turn.messages.length-1].content.length && (
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
          )}
          {/* Reference container below (full width, auto height) */}
          <div className="w-full mt-1">
            <div className="block sm:hidden">
              <div className="w-full flex flex-row items-center gap-x-2 mb-3 px-2">
                <Reference references={references} />
              </div>
            </div>
            <div className="hidden sm:block">
              <Reference references={references} />
            </div>
          </div>
        </div>
        {/* Right: Control buttons */}
        <div className="w-1/4 lg:w-1/3 flex-col items-center lg:items-end p-2 space-y-4 overflow-auto hidden sm:flex" style={{ maxHeight: '100%' }}>
          <button id="cancelButton" onClick={handleCancel} className="w-full md:w-auto flex items-center justify-center px-2 sm:px-3 py-1.5 bg-white/80 hover:bg-blue-100 text-blue-900 rounded-full text-xs font-semibold border border-white/30 shadow transition-colors mb-2" style={{fontFamily:'inherit', letterSpacing:0.2}}>
            <span className="material-icons text-base mr-1">cancel</span>Cancel
          </button>
          <button
            id="endCallButton"
            onClick={handleNext}
            className="w-full md:w-auto bg-[#d4af37] hover:bg-[#ffd700] text-blue-900 font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-full shadow-lg flex items-center justify-center space-x-2 transition-colors border border-white/30 text-xs sm:text-sm"
            style={{fontFamily:'inherit', letterSpacing:0.5}}
          >
            <span className="material-icons">send</span>
            <span className="whitespace-nowrap">Confirm Your Request</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Interface2;
