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
    try {
      localStorage.setItem('activeOrders', JSON.stringify(activeOrders));
    } catch {
      console.error('Failed to persist activeOrders to localStorage');
    }
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
        vapi.on('volume-level', (level: number) => {
          setMicLevel(level);
        });

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
            
            // Try to get content from any available field
            const outputContent = message.content || message.text || message.transcript || message.output;
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
          
          // Only handle user transcripts, ignore assistant transcripts
          if (message.type === 'transcript' && message.role === 'user') {
            console.log('Adding user transcript:', message);
            const newTranscript: Transcript = {
              id: Date.now() as unknown as number,
              callId: callDetails?.id || `call-${Date.now()}`,
              role: 'user',
              content: message.content || message.transcript || '',
              timestamp: new Date()
            };
            setTranscripts(prev => [...prev, newTranscript]);
          }
        };
        
        vapi.on('message', handleMessage);
      } catch (error) {
        console.error('Error setting up Vapi:', error);
      }
    };

    setupVapi();
    
    return () => {
      const vapi = getVapiInstance();
      if (vapi) {
        vapi.stop();
      }
    };
  }, []);

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
  const startCall = React.useCallback(async () => {
    try {
      // Reset email sent flag for new session
      setEmailSentForCurrentSession(false);
      
      // Reset call details
      const callId = `call-${Date.now()}`;
      setCallDetails({
        id: callId,
        roomNumber: '',
        duration: 0,
        category: ''
      });
      
      // Clear previous transcripts and model outputs
      setTranscripts([]);
      setModelOutput([]);
      
      // Initialize Vapi
      const vapi = getVapiInstance();
      if (!vapi) {
        console.error('Vapi instance not initialized');
        return;
      }

      // Get assistant ID from environment variable
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      if (!assistantId) {
        console.error('Assistant ID not configured');
        return;
      }

      // Start the call
      const call = await vapi.startCall(assistantId);
      if (!call) {
        console.error('Failed to start call - call object is null');
        return;
      }

      console.log('Call started successfully');

      // Reset call duration to 0
      setCallDuration(0);

      // Start call duration timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Store timer ID for cleanup
      setCallTimer(timer);

      // Update interface to show call in progress
      setCurrentInterface('interface2');

    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, []);

  // End call function
  const endCall = () => {
    const vapi = getVapiInstance();
    if (vapi) {
      vapi.stop();
    }
    
    // Stop the timer
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // Initialize with default values
    setOrderSummary(initialOrderSummary);
    
    // We'll update this with AI-generated data once the summary is received
    
    // Request OpenAI-generated summary from server using transcripts
    console.log('Requesting AI-generated summary from server...');
    
    // Format call duration for API
    const formattedDuration = callDuration ? 
      `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 
      '0:00';
      
    console.log('Sending call duration to summary endpoint:', formattedDuration);
    
    // Prepare transcripts for the API
    const transcriptData = transcripts.map(message => ({
      role: message.role,
      content: message.content
    }));
    
    // Check if we have enough transcript data
    if (transcriptData.length < 2) {
      console.log('Not enough transcript data to generate summary');
      const noTranscriptSummary: CallSummary = {
        id: Date.now() as unknown as number,
        callId: callDetails?.id || `call-${Date.now()}`,
        content: "Call was too short to generate a summary. Please try a more detailed conversation.",
        timestamp: new Date()
      };
      setCallSummary(noTranscriptSummary);
      setCurrentInterface('interface3');
      return;
    }
    
    // Show loading state for summary
    const loadingSummary: CallSummary = {
      id: Date.now() as unknown as number,
      callId: callDetails?.id || `call-${Date.now()}`,
      content: "Generating AI summary of your conversation...",
      timestamp: new Date()
    };
    setCallSummary(loadingSummary);
    
    // Send transcript data to server for OpenAI processing
    fetch('/api/store-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Send empty summary so backend knows to generate one with OpenAI
        summary: '', 
        transcripts: transcriptData,
        timestamp: new Date().toISOString(),
        callId: callDetails?.id || `call-${Date.now()}`,
        // Send the call duration for storage
        callDuration: formattedDuration,
        // Use flag from vapiClient to force basic summary if needed
        forceBasicSummary: FORCE_BASIC_SUMMARY
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('AI-generated summary received:', data);
      
      // Update the call summary in state with the AI-generated one
      if (data.success && data.summary && data.summary.content) {
        const summaryContent = data.summary.content;
        
        // Create summary object
        const aiSummary: CallSummary = {
          id: Date.now() as unknown as number,
          callId: callDetails?.id || `call-${Date.now()}`,
          content: summaryContent,
          timestamp: new Date(data.summary.timestamp || Date.now())
        };
        setCallSummary(aiSummary);
        
        // Store any extracted service requests if available
        if (data.serviceRequests && Array.isArray(data.serviceRequests) && data.serviceRequests.length > 0) {
          console.log('Service requests extracted:', data.serviceRequests);
          setServiceRequests(data.serviceRequests);
        }
        
        // Extract order details from AI summary
        try {
          console.log('Parsing AI summary to extract order details...');
          
          // Get the parsed details
          const parsedDetails = parseSummaryToOrderDetails(summaryContent);
          
          // Only update orderSummary if the AI parsed useful information
          if (Object.keys(parsedDetails).length > 0) {
            // Create a new order summary by merging parsed details with defaults
            setOrderSummary(prevSummary => {
              if (!prevSummary) return initialOrderSummary;
              
              // Start with existing order summary
              const updatedSummary = { ...prevSummary };
              
              // Update with AI-extracted information, only if present
              if (parsedDetails.orderType) updatedSummary.orderType = parsedDetails.orderType;
              if (parsedDetails.deliveryTime) updatedSummary.deliveryTime = parsedDetails.deliveryTime;
              if (parsedDetails.roomNumber) updatedSummary.roomNumber = parsedDetails.roomNumber;
              if (parsedDetails.specialInstructions) updatedSummary.specialInstructions = parsedDetails.specialInstructions;
              
              // Only update items if we extracted some
              if (parsedDetails.items && parsedDetails.items.length > 0) {
                updatedSummary.items = parsedDetails.items;
              }
              
              // Update total amount based on items or extracted value
              if (parsedDetails.totalAmount) {
                updatedSummary.totalAmount = parsedDetails.totalAmount;
              } else {
                // Recalculate based on current items
                updatedSummary.totalAmount = updatedSummary.items.reduce(
                  (total, item) => total + (item.price * item.quantity), 
                  0
                );
              }
              
              console.log('Updated order summary with AI-extracted information:', updatedSummary);
              return updatedSummary;
            });
          }
        } catch (parseError) {
          console.error('Error extracting order details from AI summary:', parseError);
          // Keep existing order summary on error
        }
      }
    })
    .catch(error => {
      console.error('Error getting AI-generated summary:', error);
      
      // Fallback to basic summary if OpenAI fails
      const fallbackSummary: CallSummary = {
        id: Date.now() as unknown as number,
        callId: callDetails?.id || `call-${Date.now()}`,
        content: "Summary could not be generated. Please review the conversation transcript.",
        timestamp: new Date()
      };
      setCallSummary(fallbackSummary);
    });
    
    // Change interface to summary
    setCurrentInterface('interface3');
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