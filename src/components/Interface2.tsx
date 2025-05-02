import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Reference from './Reference';
import SiriCallButton from './SiriCallButton';
import { referenceService, ReferenceItem } from '@/services/ReferenceService';
import { findInDictionary } from '@/utils/dictionary';

const Interface2: React.FC<Interface2Props> = ({ isActive }) => {
  // ... existing code ...

  // Process assistant message content with dictionary
  const processMessageContent = (content: string): string => {
    // Split content into words/fragments
    const fragments = content.split(/(\s+)/);
    const processedFragments = fragments.map(fragment => {
      if (fragment.trim() === '') return fragment; // Keep spaces as is
      
      // Check dictionary for this fragment
      const match = findInDictionary([fragment]);
      return match ? match.keyword : fragment;
    });
    
    return processedFragments.join('');
  };

  return (
    // ... existing code ...
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
    // ... existing code ...
  );
}; 