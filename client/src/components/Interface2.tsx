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
    try {
      // Bước 1: Tách text thành các từ
      const words = text.split(/([A-Z][a-z]+|[A-Z]{2,}(?=[A-Z][a-z]|\d|\W|$)|[0-9]+|[a-z]+|[.,!?])/g)
        .filter(word => word.trim().length > 0);

      // Bước 2: Xử lý từng từ với Dictionary
      const processedWords = words.map((word, index) => {
        // Kiểm tra từ điển cho từ hiện tại
        const dictionaryMatch = findInDictionary([word]);
        if (dictionaryMatch) {
          return dictionaryMatch.keyword;
        }

        // Kiểm tra từ điển cho cụm từ (nếu có từ tiếp theo)
        if (index < words.length - 1) {
          const phraseMatch = findInDictionary([word, words[index + 1]]);
          if (phraseMatch) {
            words[index + 1] = ''; // Đánh dấu từ tiếp theo đã được xử lý
            return phraseMatch.keyword;
          }
        }

        // Xử lý các trường hợp đặc biệt
        if (word.match(/[.,!?]/)) {
          return word + ' '; // Thêm khoảng trắng sau dấu câu
        }

        // Xử lý I'm, I'll, I've
        if (word.match(/^(I'm|I'll|I've)$/)) {
          return ' ' + word;
        }

        return word;
      });

      // Bước 3: Kết hợp các từ và xử lý khoảng trắng
      let processed = processedWords
        .filter(word => word.length > 0) // Loại bỏ các từ đã được đánh dấu
        .join(' ')
        .replace(/\s+/g, ' ') // Gộp nhiều khoảng trắng
        .trim();

      console.log('Processed text:', processed); // Log để debug
      return processed;
    } catch (error) {
      console.error('Error in processAssistantText:', error);
      return text; // Trả về text gốc nếu có lỗi
    }
  };

  // Process assistant message content with dictionary
  const processMessageContent = (content: string): string => {
    // Kiểm tra content có phải là string không
    if (typeof content !== 'string') {
      console.warn('Content is not a string:', content);
      return String(content || '');
    }

    try {
      return processAssistantText(content);
    } catch (error) {
      console.error('Error processing message content:', error);
      return content;
    }
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
                            try {
                              // Remove leading/trailing spaces
                              const content = typeof msg.content === 'string' ? msg.content.trim() : String(msg.content || '');
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
                            } catch (error) {
                              console.error('Error rendering message:', error);
                              return null; // Skip rendering this message if there's an error
                            }
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

export default Interface2; 