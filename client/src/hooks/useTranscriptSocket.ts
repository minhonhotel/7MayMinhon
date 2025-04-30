import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseTranscriptSocketProps {
  socketUrl: string;
}

interface TranscriptState {
  text: string;
  isAssistantSpeaking: boolean;
}

export const useTranscriptSocket = ({ socketUrl }: UseTranscriptSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<TranscriptState>({
    text: '',
    isAssistantSpeaking: false,
  });

  // Khởi tạo WebSocket connection
  useEffect(() => {
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [socketUrl]);

  // Xử lý các events
  useEffect(() => {
    if (!socket) return;

    const handleUserTranscript = (data: { text: string }) => {
      if (!state.isAssistantSpeaking) {
        setState(prev => ({ ...prev, text: data.text }));
      }
    };

    const handleAssistantResponse = (data: { assistant_reply_text: string }) => {
      if (state.isAssistantSpeaking) {
        setState(prev => ({ ...prev, text: data.assistant_reply_text }));
      }
    };

    const handleAssistantStartSpeaking = () => {
      setState(prev => ({ ...prev, isAssistantSpeaking: true }));
    };

    const handleAssistantEndSpeaking = () => {
      setState(prev => ({ ...prev, isAssistantSpeaking: false }));
    };

    // Đăng ký các event listeners
    socket.on('userTranscript', handleUserTranscript);
    socket.on('assistantResponse', handleAssistantResponse);
    socket.on('assistantStartSpeaking', handleAssistantStartSpeaking);
    socket.on('assistantEndSpeaking', handleAssistantEndSpeaking);

    // Cleanup
    return () => {
      socket.off('userTranscript', handleUserTranscript);
      socket.off('assistantResponse', handleAssistantResponse);
      socket.off('assistantStartSpeaking', handleAssistantStartSpeaking);
      socket.off('assistantEndSpeaking', handleAssistantEndSpeaking);
    };
  }, [socket, state.isAssistantSpeaking]);

  return {
    transcript: state.text,
    isAssistantSpeaking: state.isAssistantSpeaking,
  };
}; 