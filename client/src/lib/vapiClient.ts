import Vapi from '@vapi-ai/web';

// Initialize with environment variable or fallback
const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || 'demo';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Option to force basic summary generation (for testing fallback)
export const FORCE_BASIC_SUMMARY = false; // Set to true to always use basic summary

export let vapiInstance: Vapi | null = null;

async function initializeWithRetry(retryCount = 0): Promise<Vapi | null> {
  try {
    console.log(`Attempting to initialize Vapi (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    const instance = new Vapi(PUBLIC_KEY, {
      debug: true, // Enable debug mode for more detailed logs
    });
    return instance;
  } catch (error) {
    console.error(`Initialization attempt ${retryCount + 1} failed:`, error);
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return initializeWithRetry(retryCount + 1);
    }
    return null;
  }
}

export async function initVapi() {
  if (!vapiInstance) {
    try {
      console.log('Starting Vapi initialization...');
      
      // Initialize with retry logic
      vapiInstance = await initializeWithRetry();
      
      if (!vapiInstance) {
        throw new Error('Failed to initialize Vapi after multiple attempts');
      }
      
      // Setup event listeners
      setupVapiEventListeners();
      console.log('Vapi initialized successfully');
      
      // Test WebSocket connection
      vapiInstance.on('open', () => {
        console.log('WebSocket connection established successfully');
      });
      
      vapiInstance.on('close', (event) => {
        console.log('WebSocket connection closed:', event);
        // Attempt to reconnect on unexpected closure
        if (event.code !== 1000) { // 1000 is normal closure
          console.log('Attempting to reconnect...');
          initVapi();
        }
      });
      
      vapiInstance.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      vapiInstance = null;
      return null;
    }
  }
  
  return vapiInstance;
}

// Event handling will be delegated to the AssistantContext
function setupVapiEventListeners() {
  if (!vapiInstance) return;
  
  // Speech events
  vapiInstance.on('speech-start', () => {
    console.log('Speech has started');
  });
  
  vapiInstance.on('speech-end', () => {
    console.log('Speech has ended');
  });
  
  // Call lifecycle events
  vapiInstance.on('call-start', () => {
    console.log('Call has started');
  });
  
  vapiInstance.on('call-end', () => {
    console.log('Call has stopped');
  });
  
  // Volume level monitoring
  vapiInstance.on('volume-level', (volume) => {
    console.log(`Assistant volume level: ${volume}`);
  });
  
  // Message handling (transcripts and function calls)
  vapiInstance.on('message', (message) => {
    console.log('Received message:', message);
    
    // Handle different message types
    switch (message.type) {
      case 'transcript':
        console.log('Transcript received:', message.transcript);
        break;
      case 'model-output':
        console.log('Model output received:', message.content);
        break;
      case 'end_of_call_report':
        if (message.summary) {
          console.log('End of call report received:', message.summary);
        }
        break;
      case 'status-update':
        if (message.status === 'ended') {
          console.log('Call ended with reason:', message.endedReason);
        }
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  });
  
  // Error handling
  vapiInstance.on('error', (error) => {
    console.error('Vapi error:', error);
  });
}

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
