import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Reference from './Reference';
import SiriCallButton from './SiriCallButton';
import { referenceService, ReferenceItem } from '@/services/ReferenceService';
import { findInDictionary } from '@/utils/dictionary';

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

  // Hàm xử lý text từ assistant
  const processAssistantText = (text: string): string => {
    // Bước 1: Tách theo các dấu câu và khoảng trắng hiện có
    let processed = text.replace(/([!?.,])/g, ' $1 ');
    
    // Bước 2: Tách các từ theo quy tắc camelCase/PascalCase
    processed = processed.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // Bước 3: Tách các từ viết hoa liền nhau
    processed = processed.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    
    // Bước 4: Loại bỏ khoảng trắng thừa
    processed = processed.replace(/\s+/g, ' ').trim();
    
    return processed;
  };

  // Process assistant message content with dictionary
  const processMessageContent = (content: string): string => {
    // Xử lý text trước
    const processedText = processAssistantText(content);
    
    // Sau đó mới tách và kiểm tra dictionary
    const fragments = processedText.split(/(\s+)/);
    const processedFragments = fragments.map(fragment => {
      if (fragment.trim() === '') return fragment; // Keep spaces as is
      
      // Check dictionary for this fragment
      const match = findInDictionary([fragment]);
      return match ? match.keyword : fragment;
    });
    
    return processedFragments.join('');
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

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
            className="relative p-2 w-full min-h-[60px] max-h-[128px] overflow-y-auto"
          >
            {/* Display conversation turns */}
            {conversationTurns.map((turn) => (
              <div key={turn.id} className="mb-2">
                <div className="flex items-start mb-1">
                  <div className="flex-grow">
                    {turn.role === 'user' ? (
                      // User message - display as is
                      <p className="text-xl font-semibold text-white">
                        {turn.messages[0].content}
                      </p>
                    ) : (
                      // Assistant messages - display inline with proper spacing and paint-on effect
                      <p className="text-xl font-semibold text-yellow-200">
                        <span className="inline-flex flex-wrap">
                          {turn.messages.map((msg, idx) => {
                            // Remove leading/trailing spaces
                            const content = msg.content.trim();
                            // Process content through dictionary
                            const processedContent = processMessageContent(content);
                            // Add appropriate spacing
                            const needsSpaceBefore = idx > 0 && !processedContent.startsWith(',') && !processedContent.startsWith('.') && !processedContent.startsWith('?') && !processedContent.startsWith('!');
                            // Get visible characters for this message
                            const visibleContent = processedContent.slice(0, visibleChars[msg.id] || 0);
                            return (
                              <span key={msg.id}>
                                {needsSpaceBefore ? ' ' : ''}
                                {visibleContent}
                              </span>
                            );
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 