import Vapi from '@vapi-ai/web';

// Initialize with environment variable or fallback
const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || 'demo';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Option to force basic summary generation (for testing fallback)
export const FORCE_BASIC_SUMMARY = false; // Set to true to always use basic summary

// Define message types based on Vapi's API
type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

interface Message {
  role: MessageRole;
  content: string;
}

interface AddMessage {
  type: 'add-message';
  message: Message;
}

let vapiInstance: Vapi | null = null;

interface VapiConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected';
}

interface VapiMessage {
  type: string;
  content?: string;
  [key: string]: any;
}

type VapiEventNames = 'call-start' | 'call-end' | 'speech-start' | 'speech-end' | 'volume-level' | 'message' | 'error';
type VapiEventHandler<T = any> = (data: T) => void;

export const initVapi = async (publicKey: string): Promise<Vapi> => {
  try {
    // Check if public key is valid
    if (!publicKey || publicKey === 'demo') {
      throw new Error('Invalid Vapi public key. Please check your .env configuration.');
    }

    // Return existing instance if already initialized
    if (vapiInstance) {
      console.log('Reusing existing Vapi instance');
      return vapiInstance;
    }

    console.log('Initializing new Vapi instance');
    vapiInstance = new Vapi(publicKey);

    // Add event listeners with error handling
    const addListener = (event: VapiEventNames, handler: VapiEventHandler) => {
      try {
        vapiInstance?.on(event, (data: unknown) => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in ${event} handler:`, error);
          }
        });
      } catch (error) {
        console.error(`Error adding ${event} listener:`, error);
      }
    };

    addListener('call-start', () => {
      console.log('Call started');
    });

    addListener('call-end', () => {
      console.log('Call ended');
    });

    addListener('speech-start', () => {
      console.log('Speech started');
    });

    addListener('speech-end', () => {
      console.log('Speech ended');
    });

    addListener('volume-level', (volume: number) => {
      console.log(`Volume level: ${volume}`);
    });

    addListener('message', (message: VapiMessage) => {
      console.log('Message received:', message);
    });

    addListener('error', (error: Error) => {
      console.error('Vapi error:', error);
    });

    return vapiInstance;
  } catch (error) {
    console.error('Failed to initialize Vapi:', error);
    // Reset instance if initialization fails
    vapiInstance = null;
    throw error;
  }
};

export const getVapiInstance = (): Vapi | null => {
  return vapiInstance;
};

export const isVapiInitialized = (): boolean => {
  return vapiInstance !== null;
};

export const startCall = async (assistantId: string, assistantOverrides?: any) => {
  if (!vapiInstance) {
    throw new Error('Vapi not initialized. Call initVapi first.');
  }

  let retries = MAX_RETRIES;
  while (retries > 0) {
    try {
      console.log(`Attempting to start call with assistant ID: ${assistantId}`);
      const call = await vapiInstance.start(assistantId, assistantOverrides);
      console.log('Call started successfully');
      return call;
    } catch (error) {
      console.error(`Failed to start call (${retries} retries left):`, error);
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

export const stopCall = () => {
  if (!vapiInstance) {
    throw new Error('Vapi not initialized. Call initVapi first.');
  }

  try {
    vapiInstance.stop();
  } catch (error) {
    console.error('Failed to stop call:', error);
    throw error;
  }
};

export const setMuted = (muted: boolean) => {
  if (!vapiInstance) {
    throw new Error('Vapi not initialized. Call initVapi first.');
  }

  try {
    vapiInstance.setMuted(muted);
  } catch (error) {
    console.error('Failed to set mute state:', error);
    throw error;
  }
};

export const isMuted = (): boolean => {
  if (!vapiInstance) {
    throw new Error('Vapi not initialized. Call initVapi first.');
  }

  try {
    return vapiInstance.isMuted();
  } catch (error) {
    console.error('Failed to get mute state:', error);
    throw error;
  }
};

export const sendMessage = (content: string, role: 'system' | 'user' = 'system') => {
  if (!vapiInstance) {
    throw new Error('Vapi not initialized. Call initVapi first.');
  }

  try {
    vapiInstance.send({
      type: 'add-message',
      message: {
        role,
        content
      }
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

export const say = (message: string, endCallAfterSpoken?: boolean) => {
  if (!vapiInstance) {
    throw new Error('Vapi not initialized. Call initVapi first.');
  }

  try {
    vapiInstance.say(message, endCallAfterSpoken);
  } catch (error) {
    console.error('Failed to say message:', error);
    throw error;
  }
};

export const buttonConfig = {
  position: "top",
  offset: "240px",
  width: "120px",
  height: "120px",
  idle: {
    color: `rgb(93, 254, 202)`,
    type: "round",
    title: "Have a quick question?",
    subtitle: "Talk with our AI assistant",
    icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone.svg`,
  },
  loading: {
    color: `rgb(93, 124, 202)`,
    type: "round",
    title: "Connecting...",
    subtitle: "Please wait",
    icon: `https://unpkg.com/lucide-static@0.321.0/icons/loader-2.svg`,
  },
  active: {
    color: `rgb(255, 0, 0)`,
    type: "round",
    title: "Call is in progress...",
    subtitle: "End the call.",
    icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone-off.svg`,
  },
};
