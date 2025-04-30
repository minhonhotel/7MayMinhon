import Vapi from '@vapi-ai/web';

// Initialize with environment variable or fallback
const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || 'demo';

// Option to force basic summary generation (for testing fallback)
export const FORCE_BASIC_SUMMARY = false; // Set to true to always use basic summary

export let vapiInstance: Vapi | null = null;

export function initVapi() {
  if (!vapiInstance) {
    try {
      vapiInstance = new Vapi(PUBLIC_KEY);
      
      // Setup event listeners
      setupVapiEventListeners();
      console.log('Vapi initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      return null;
    }
  }
  
  return vapiInstance;
}

// Event handling will be delegated to the AssistantContext
function setupVapiEventListeners() {
  if (!vapiInstance) return;
  
  // Speech start event
  vapiInstance.on('speech-start', () => {
    console.log('Assistant started speaking');
  });
  
  // Speech end event
  vapiInstance.on('speech-end', () => {
    console.log('Assistant stopped speaking');
  });
  
  // Call start event
  vapiInstance.on('call-start', () => {
    console.log('Call has started');
  });
  
  // Call end event
  vapiInstance.on('call-end', () => {
    console.log('Call has ended');
  });
  
  // Volume level event
  vapiInstance.on('volume-level', (volume) => {
    console.log(`Assistant volume level: ${volume}`);
  });
  
  // Message event (function calls and transcripts)
  vapiInstance.on('message', (message) => {
    console.log('Received message:', message);
    
    // Handle end of call report with summary
    if (message.type === 'end_of_call_report' && message.summary) {
      console.log('End of call report received with summary:', message.summary);
      
      // Display the summary in the container if it exists
      const summaryContainer = document.getElementById('summary-container');
      if (summaryContainer) {
        const summaryContent = `
          <div class="p-4 bg-blue-50 rounded-lg shadow-sm">
            <h3 class="font-medium text-lg mb-2 text-blue-800">Call Summary</h3>
            <p class="text-gray-700">${message.summary}</p>
          </div>
        `;
        summaryContainer.innerHTML = summaryContent;
      }
      
      // Send the summary to the server
      fetch('/api/store-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: message.summary,
          timestamp: new Date().toISOString()
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        console.log('Summary successfully sent to server');
      })
      .catch(error => {
        console.error('Error sending summary to server:', error);
      });
    }
    
    // Special handling for status updates to detect end of call
    if (message.type === 'status-update' && message.status === 'ended') {
      console.log('Call ended with reason:', message.endedReason);
    }
  });
  
  // Error event
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
