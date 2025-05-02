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

const Interface2: React.FC<Interface2Props> = ({ isActive }) => {
  const { conversationTurns } = useAssistant();
  const [visibleChars, setVisibleChars] = useState<{ [key: string]: number }>({});
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedMessages, setProcessedMessages] = useState<{ [key: string]: string }>({});

  // Process assistant message content with maximum matching
  const processMessageContent = useCallback((content: string, messageId: string): string => {
    // Kiểm tra xem message đã được xử lý chưa
    if (processedMessages[messageId]) {
      return processedMessages[messageId];
    }

    // Xử lý text
    const { words } = processText(content);
    const processedContent = applySmartSpacing(words);
    
    // Lưu kết quả đã xử lý
    setProcessedMessages(prev => ({
      ...prev,
      [messageId]: processedContent
    }));
    
    return processedContent;
  }, [processedMessages]);

  // Paint-on effect for each message
  useEffect(() => {
    conversationTurns.forEach(turn => {
      if (turn.role === 'assistant') {
        turn.messages.forEach(msg => {
          const content = msg.content.trim();
          const totalChars = content.length;
          
          // Tạo paint-on effect
          let currentChar = 0;
          const interval = setInterval(() => {
            if (currentChar <= totalChars) {
              setVisibleChars(prev => ({
                ...prev,
                [msg.id]: currentChar
              }));
              currentChar++;
            } else {
              clearInterval(interval);
            }
          }, 20); // Tốc độ hiển thị

          return () => clearInterval(interval);
        });
      }
    });
  }, [conversationTurns]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [conversationTurns, visibleChars]);

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