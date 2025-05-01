import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transcript, OrderSummary, CallDetails, Order, InterfaceLayer, CallSummary, ServiceRequest, ActiveOrder } from '@/types';
import { initVapi, getVapiInstance, FORCE_BASIC_SUMMARY } from '@/lib/vapiClient';
import { apiRequest } from '@/lib/queryClient';
import { parseSummaryToOrderDetails } from '@/lib/summaryParser';

interface AssistantContextType {
  currentInterface: InterfaceLayer;
  setCurrentInterface: (layer: InterfaceLayer) => void;
  transcripts: Transcript[];
  addTranscript: (transcript: Omit<Transcript, 'id' | 'timestamp'>) => void;
  orderSummary: OrderSummary | null;
  setOrderSummary: (summary: OrderSummary) => void;
  callDetails: CallDetails | null;
  setCallDetails: (details: CallDetails) => void;
  order: Order | null;
  setOrder: (order: Order) => void;
  callDuration: number;
  isMuted: boolean;
  toggleMute: () => void;
  startCall: () => Promise<void>;
  endCall: () => void;
  callSummary: CallSummary | null;
  setCallSummary: (summary: CallSummary) => void;
  serviceRequests: ServiceRequest[];
  setServiceRequests: (requests: ServiceRequest[]) => void;
  vietnameseSummary: string | null;
  setVietnameseSummary: (summary: string) => void;
  translateToVietnamese: (text: string) => Promise<string>;
  emailSentForCurrentSession: boolean;
  setEmailSentForCurrentSession: (sent: boolean) => void;
  requestReceivedAt: Date | null;
  setRequestReceivedAt: (date: Date | null) => void;
  activeOrders: ActiveOrder[];
  addActiveOrder: (order: ActiveOrder) => void;
  micLevel: number;
  modelOutput: string[];
  addModelOutput: (output: string) => void;
}

const initialOrderSummary: OrderSummary = {
  orderType: 'Room Service',
  deliveryTime: 'asap',
  roomNumber: '',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  specialInstructions: '',
  items: [
    {
      id: '1',
      name: 'Club Sandwich',
      description: 'Served with french fries and side salad',
      quantity: 1,
      price: 15.00
    },
    {
      id: '2', 
      name: 'Fresh Orange Juice',
      description: 'Large size',
      quantity: 1,
      price: 8.00
    }
  ],
  totalAmount: 23.00
};

// Context definition
const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [currentInterface, setCurrentInterface] = useState<InterfaceLayer>('interface1');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [callDetails, setCallDetails] = useState<CallDetails | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [vietnameseSummary, setVietnameseSummary] = useState<string | null>(null);
  const [emailSentForCurrentSession, setEmailSentForCurrentSession] = useState<boolean>(false);
  const [requestReceivedAt, setRequestReceivedAt] = useState<Date | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('activeOrders');
      if (!stored) return [];
      const parsed = JSON.parse(stored) as (ActiveOrder & { requestedAt: string })[];
      // Convert requestedAt string back into Date
      return parsed.map(o => ({
        ...o,
        requestedAt: new Date(o.requestedAt)
      }));
    } catch (err) {
      console.error('Failed to parse activeOrders from localStorage', err);
      return [];
    }
  });
  const [micLevel, setMicLevel] = useState<number>(0);
  const [modelOutput, setModelOutput] = useState<string[]>([]);

  // Persist activeOrders to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saveToStorage = () => {
      try {
        localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
      } catch (err) {
        console.error('Failed to persist activeOrders to localStorage', err);
      }
    };
    saveToStorage();
  }, [activeOrders]);

  const addActiveOrder = (order: ActiveOrder) => {
    setActiveOrders(prev => [...prev, order]);
  };

  // Add transcript to the list
  const addTranscript = React.useCallback((transcript: Omit<Transcript, 'id' | 'timestamp' | 'callId'>) => {
    const newTranscript: Transcript = {
      ...transcript,
      id: Date.now() as unknown as number,
      callId: callDetails?.id || `call-${Date.now()}`,
      timestamp: new Date()
    };
    setTranscripts(prev => [...prev, newTranscript]);
  }, [callDetails?.id]);

  // Initialize Vapi when component mounts
  useEffect(() => {
    const setupVapi = async () => {
      try {
        const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Vapi public key is not configured');
        }
        
        const vapi = await initVapi(publicKey);

        // Setup event listeners after successful initialization
        const volumeHandler = (level: number) => {
          setMicLevel(level);
        };
        vapi.on('volume-level', volumeHandler);

        // Message handler for transcripts and reports
        const handleMessage = async (message: any) => {
          console.log('Raw message received:', message);
          console.log('Message type:', message.type);
          console.log('Message role:', message.role);
          console.log('Message content structure:', {
            content: message.content,
            text: message.text,
            transcript: message.transcript
          });
          
          // For model output - handle this first
          if (message.type === 'model-output') {
            console.log('Model output detected - Full message:', message);
            
            // Try to get content from any available field and ensure it's a string
            const outputContent = String(message.content || message.text || message.transcript || message.output || '');
            if (outputContent) {
              console.log('Adding model output to conversation:', outputContent);
              
              // Add as transcript with isModelOutput flag
              const newTranscript: Transcript = {
                id: Date.now() as unknown as number,
                callId: callDetails?.id || `call-${Date.now()}`,
                role: 'assistant',
                content: outputContent,
                timestamp: new Date(),
                isModelOutput: true
              };
              console.log('Adding new transcript for model output:', newTranscript);
              setTranscripts(prev => {
                const updated = [...prev, newTranscript];
                console.log('Updated transcripts array:', updated);
                return updated;
              });
            } else {
              console.warn('Model output message received but no content found:', message);
            }
          }
          
          // Only handle user transcripts, ignore regular assistant transcripts
          if (message.type === 'transcript' && message.role === 'user') {
            console.log('Adding user transcript:', message);
            const newTranscript: Transcript = {
              id: Date.now() as unknown as number,
              callId: callDetails?.id || `call-${Date.now()}`,
              role: 'user',
              content: String(message.content || message.transcript || ''),
              timestamp: new Date()
            };
            setTranscripts(prev => [...prev, newTranscript]);
          }
        };
        
        vapi.on('message', handleMessage);

        // Cleanup function
        return () => {
          vapi.off('volume-level', volumeHandler);
          vapi.off('message', handleMessage);
        };
      } catch (error) {
        console.error('Failed to initialize Vapi:', error);
      }
    };

    setupVapi();
  }, []); // Empty dependency array since this should only run once on mount

  useEffect(() => {
    if (currentInterface === 'interface2') {
      // Start call timer when in interface2
      console.log('Starting call duration timer in interface2');
      const timer = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          console.log('Call duration updated:', newDuration);
          return newDuration;
        });
      }, 1000);
      setCallTimer(timer);
    } else {
      // Clear timer when not in interface2
      if (callTimer) {
        console.log('Clearing call duration timer when leaving interface2');
        clearInterval(callTimer);
        setCallTimer(null);
      }
    }

    return () => {
      if (callTimer) {
        console.log('Cleaning up call duration timer');
        clearInterval(callTimer);
      }
    };
  }, [currentInterface, callTimer]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  // Toggle mute state
  const toggleMute = () => {
    const vapi = getVapiInstance();
    if (vapi) {
      vapi.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Start call function
  const startCall = async () => {
    const vapi = getVapiInstance();
    if (!vapi) {
      console.error("Vapi instance is not initialized");
      return;
    }

    setRequestReceivedAt(new Date());

    try {
      // Use the assistant ID directly instead of configuration object
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        throw new Error('Assistant ID is not configured');
      }

      const call = await vapi.start(assistantId);
      if (!call) {
        throw new Error('Failed to start call: call object is null');
      }
      
      console.log("Call started successfully:", call);

      // Reset email sent flag for new call
      setEmailSentForCurrentSession(false);
      
      // Initialize call details
      setCallDetails({
        id: call.id || `call-${Date.now()}`,
        roomNumber: '',
        duration: '00:00',
        category: 'Room Service'
      });
      
      // Clear previous transcripts and model outputs
      setTranscripts([]);
      setModelOutput([]);
      
      // Change interface to call in progress
      setCurrentInterface('interface2');
      
      // Start call duration timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      setCallTimer(timer);

      // Reset call duration
      setCallDuration(0);

    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  // End call function
  const endCall = () => {
    try {
      const vapi = getVapiInstance();
      if (vapi) {
        vapi.stop();
      }

      // Clear timer if it exists
      if (callTimer) {
        clearInterval(callTimer);
        setCallTimer(null);
      }

      // Reset states
      setCallDuration(0);
      setIsMuted(false);
      setModelOutput([]);
      setMicLevel(0);

      console.log('Call ended successfully');
    } catch (error) {
      console.error('Error ending call:', error);
      // Still reset states even if there's an error
      if (callTimer) {
        clearInterval(callTimer);
        setCallTimer(null);
      }
      setCallDuration(0);
      setIsMuted(false);
      setModelOutput([]);
      setMicLevel(0);
    }
  };

  // Function to translate text to Vietnamese
  const translateToVietnamese = async (text: string): Promise<string> => {
    try {
      console.log('Requesting Vietnamese translation for summary...');
      const response = await fetch('/api/translate-to-vietnamese', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.translatedText) {
        // Save the translated text
        setVietnameseSummary(data.translatedText);
        return data.translatedText;
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Error translating to Vietnamese:', error);
      return 'Không thể dịch nội dung này sang tiếng Việt. Vui lòng thử lại sau.';
    }
  };

  const addModelOutput = (output: string) => {
    setModelOutput(prev => [...prev, output]);
  };

  const value: AssistantContextType = {
    currentInterface,
    setCurrentInterface,
    transcripts,
    addTranscript,
    orderSummary,
    setOrderSummary,
    callDetails,
    setCallDetails,
    order,
    setOrder,
    callDuration,
    isMuted,
    toggleMute,
    startCall,
    endCall,
    callSummary,
    setCallSummary,
    serviceRequests,
    setServiceRequests,
    vietnameseSummary,
    setVietnameseSummary,
    translateToVietnamese,
    emailSentForCurrentSession,
    setEmailSentForCurrentSession,
    requestReceivedAt,
    setRequestReceivedAt,
    activeOrders,
    addActiveOrder,
    micLevel,
    modelOutput,
    addModelOutput,
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}