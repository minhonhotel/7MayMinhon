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
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [modelOutput, setModelOutput] = useState<string[]>([]);
  const [isVapiInitialized, setIsVapiInitialized] = useState<boolean>(false);

  // Initialize Vapi when component mounts
  useEffect(() => {
    let mounted = true;

    const setupVapi = async () => {
      try {
        const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
        if (!publicKey) {
          throw new Error('Vapi public key is not configured');
        }
        
        if (!isVapiInitialized) {
          const vapi = await initVapi(publicKey);
          if (!mounted) return;

          // Setup event listeners after successful initialization
          vapi.on('volume-level', (level: number) => {
            if (mounted) setMicLevel(level);
          });

          // Message handler for transcripts and reports
          const handleMessage = async (message: any) => {
            if (!mounted) return;
            
            console.log('Raw message received:', message);
            console.log('Message type:', message.type);
            console.log('Message role:', message.role);
            console.log('Message content structure:', {
              content: message.content,
              text: message.text,
              transcript: message.transcript
            });

            // Handle different message types
            if (message.type === 'transcript') {
              addTranscript({
                callId: callDetails?.id || 'unknown',
                role: message.role,
                content: message.text || message.content || message.transcript || ''
              });
            } else if (message.type === 'report') {
              setModelOutput(prev => [...prev, message.content]);
            }
          };

          vapi.on('message', handleMessage);
          vapi.on('error', (error: Error) => {
            console.error('Vapi error:', error);
          });

          setIsVapiInitialized(true);
        }
      } catch (error) {
        console.error('Error setting up Vapi:', error);
      }
    };

    setupVapi();
    
    return () => {
      mounted = false;
      const vapi = getVapiInstance();
      if (vapi) {
        vapi.stop();
      }
    };
  }, [callDetails]);

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
    if (!isVapiInitialized) {
      console.error("Vapi instance is not initialized");
      return;
    }

    const vapi = getVapiInstance();
    if (!vapi) {
      console.error("Could not get Vapi instance");
      return;
    }

    setRequestReceivedAt(new Date());

    try {
      // Use the assistant ID directly instead of configuration object
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        throw new Error('Assistant ID is not configured');
      }

      // Add retry logic for starting the call
      let retryCount = 0;
      let call = null;
      
      while (retryCount < 3 && !call) {
        try {
          call = await vapi.start(assistantId);
          if (!call) {
            throw new Error('Call object is null');
          }
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          if (retryCount < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          } else {
            throw error;
          }
        }
      }

      if (!call) {
        throw new Error('Failed to start call after retries');
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
      console.error('Failed to start call:', error);
      throw error;
    }
  };

  // End call function
  const endCall = () => {
    const vapi = getVapiInstance();
    if (vapi) {
      vapi.stop();
    }
    
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    setCallDuration(0);
  };

  // Add transcript
  const addTranscript = (transcript: Omit<Transcript, 'id' | 'timestamp'>) => {
    const newTranscript: Transcript = {
      ...transcript,
      id: parseInt(Date.now().toString()),
      timestamp: new Date()
    };
    setTranscripts(prev => [...prev, newTranscript]);
  };

  // Add model output
  const addModelOutput = (output: string) => {
    setModelOutput(prev => [...prev, output]);
  };

  // Add active order
  const addActiveOrder = (order: ActiveOrder) => {
    setActiveOrders(prev => [...prev, order]);
  };

  // Translate to Vietnamese
  const translateToVietnamese = async (text: string): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Translation request failed');
      }
      
      const data = await response.json();
      setVietnameseSummary(data.translation);
      return data.translation;
    } catch (error) {
      console.error('Translation error:', error);
      return 'Translation failed';
    }
  };

  const value = {
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
    addModelOutput
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