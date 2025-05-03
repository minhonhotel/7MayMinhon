import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Reference from './Reference';
import SiriCallButton from './SiriCallButton';
import { referenceService, ReferenceItem } from '@/services/ReferenceService';
import { findInDictionary } from '@/utils/dictionary';
import { processText, applySmartSpacing } from '@/utils/textProcessing';

interface Interface2Props {
  isActive: boolean;
}

interface ProcessedMessage {
  id: string;
  content: string;
  isComplete: boolean;
  timestamp: number;
}

const Interface2: React.FC<Interface2Props> = ({ isActive }) => {
  const { conversationTurns } = useAssistant();
  const [visibleChars, setVisibleChars] = useState<{ [key: string]: number }>({});
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Cải thiện quản lý state cho processed messages
  const [processedMessages, setProcessedMessages] = useState<{ [key: string]: ProcessedMessage }>({});
  
  // Cleanup processedMessages khi số lượng lớn
  useEffect(() => {
    const CACHE_LIMIT = 100; // Giới hạn số lượng tin nhắn được cache
    const CACHE_LIFETIME = 30 * 60 * 1000; // 30 phút
    
    const cleanup = () => {
      const now = Date.now();
      setProcessedMessages(prev => {
        const entries = Object.entries(prev);
        if (entries.length <= CACHE_LIMIT) return prev;
        
        // Lọc bỏ các tin nhắn cũ
        const filtered = entries.filter(([_, msg]) => {
          const age = now - msg.timestamp;
          return age < CACHE_LIFETIME;
        });
        
        return Object.fromEntries(filtered);
      });
    };
    
    // Chạy cleanup mỗi 5 phút
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Process assistant message content with maximum matching
  const processMessageContent = useCallback((content: string, messageId: string): string => {
    const now = Date.now();
    
    // Kiểm tra cache
    const cached = processedMessages[messageId];
    if (cached?.isComplete) {
      return cached.content;
    }
    
    // Xử lý text bằng maximum matching
    const { words } = processText(content);
    const processedContent = applySmartSpacing(words);
    console.log('DEBUG segmented:', processedContent); // Log kiểm tra kết quả tách từ
    
    // Lưu kết quả với trạng thái và timestamp
    setProcessedMessages(prev => ({
      ...prev,
      [messageId]: {
        id: messageId,
        content: processedContent,
        isComplete: true,
        timestamp: now
      }
    }));
    
    return processedContent;
  }, [processedMessages]);

  // Paint-on effect for each message with improved stream handling
  useEffect(() => {
    conversationTurns.forEach(turn => {
      if (turn.role === 'assistant') {
        turn.messages.forEach(msg => {
          const content = msg.content.trim();
          const processedContent = processMessageContent(content, msg.id);
          const totalChars = processedContent.length;
          
          // Kiểm tra nếu tin nhắn đã hoàn thành
          const processed = processedMessages[msg.id];
          if (processed?.isComplete && visibleChars[msg.id] === totalChars) {
            return;
          }
          
          // Tạo paint-on effect với độ trễ phù hợp
          let currentChar = visibleChars[msg.id] || 0;
          const startDelay = 100; // Đợi 100ms trước khi bắt đầu hiển thị
          
          setTimeout(() => {
            const interval = setInterval(() => {
              if (currentChar <= totalChars) {
                setVisibleChars(prev => ({
                  ...prev,
                  [msg.id]: currentChar
                }));
                currentChar++;
              } else {
                clearInterval(interval);
                // Đánh dấu tin nhắn đã hoàn thành
                setProcessedMessages(prev => ({
                  ...prev,
                  [msg.id]: {
                    ...prev[msg.id],
                    isComplete: true
                  }
                }));
              }
            }, 20); // Tốc độ hiển thị
            
            return () => clearInterval(interval);
          }, startDelay);
        });
      }
    });
  }, [conversationTurns, processedMessages, processMessageContent]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current && isActive) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [conversationTurns, visibleChars, isActive]);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 ${isActive ? '' : 'hidden'}`}
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
                // Assistant messages - process and display with paint-on effect
                <p className="text-xl font-semibold text-yellow-200">
                  <span className="inline-flex flex-wrap">
                    {turn.messages.map((msg, idx) => {
                      const content = msg.content.trim();
                      const processedContent = processMessageContent(content, msg.id);
                      const needsSpaceBefore = idx > 0;
                      const visibleContent = processedContent.slice(0, visibleChars[msg.id] || 0);
                      
                      return (
                        <span key={msg.id} className="whitespace-pre-wrap">
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
  );
};

export default Interface2; 