import React, { useEffect, useState } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import { ServiceRequest } from '@/types';
import hotelImage from '../assets/hotel-exterior.jpeg';
import InfographicSteps from './InfographicSteps';

interface Interface3Props {
  isActive: boolean;
}

const Interface3: React.FC<Interface3Props> = ({ isActive }) => {
  const { 
    orderSummary, 
    setOrderSummary, 
    setCurrentInterface,
    setOrder,
    callSummary,
    setCallSummary,
    serviceRequests,
    callDuration,
    callDetails,
    emailSentForCurrentSession,
    setEmailSentForCurrentSession,
    addActiveOrder,
    translateToVietnamese
  } = useAssistant();
  
  // Local state for grouping service requests by type
  const [groupedRequests, setGroupedRequests] = useState<Record<string, ServiceRequest[]>>({});
  // State for user-provided additional notes
  const [note, setNote] = useState('');
  
  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    if (!orderSummary) return;
    
    setOrderSummary({
      ...orderSummary,
      [field]: value
    });
  };
  
  // Handle item removal
  const handleRemoveItem = (itemId: string) => {
    if (!orderSummary) return;
    
    const updatedItems = orderSummary.items.filter(item => item.id !== itemId);
    const newTotalAmount = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setOrderSummary({
      ...orderSummary,
      items: updatedItems,
      totalAmount: newTotalAmount
    });
  };
  
  // Group service requests by type for better organization
  useEffect(() => {
    if (serviceRequests && serviceRequests.length > 0) {
      // Group the requests by service type
      const grouped = serviceRequests.reduce((acc, request) => {
        const type = request.serviceType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(request);
        return acc;
      }, {} as Record<string, ServiceRequest[]>);
      
      setGroupedRequests(grouped);
      
      // Generate OrderItems based on service requests
      if (orderSummary && (!orderSummary.items || orderSummary.items.length === 0)) {
        // Create items from service requests
        const newItems = serviceRequests.map((request, index) => {
          // Determine appropriate quantity based on details
          let quantity = 1;
          
          // Look for specific quantities in the request text or details
          const details = request.details || {};
          const quantityMatch = request.requestText.match(/(\d+)\s+(towels|bottles|pieces|cups|glasses|plates|servings|items)/i);
          if (quantityMatch) {
            quantity = parseInt(quantityMatch[1]);
          } else if (typeof details.people === 'number') {
            // For tours, transportation, use people count as quantity reference
            quantity = details.people;
          }
          
          // Calculate appropriate price based on service type
          let price = 10; // Default price
          if (request.serviceType === 'room-service') price = 15;
          else if (request.serviceType === 'housekeeping') price = 8;
          else if (request.serviceType === 'transportation') price = 25;
          else if (request.serviceType === 'tours-activities') price = 35;
          else if (request.serviceType === 'spa') price = 30;
          
          return {
            id: `item-${index}`,
            name: request.serviceType,
            description: request.requestText,
            quantity,
            price
          };
        });

        // Update order summary with new items
        setOrderSummary({
          ...orderSummary,
          items: newItems,
          totalAmount: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        });
      }
    }
  }, [serviceRequests, orderSummary, setOrderSummary]);
  
  // Helper function to get readable service name from service type
  const getServiceName = (serviceType: string): string => {
    const typeMap: Record<string, string> = {
      'room-service': 'Room Service',
      'housekeeping': 'Housekeeping',
      'wake-up': 'Wake-up Call',
      'amenities': 'Additional Amenities',
      'restaurant': 'Restaurant Reservation',
      'spa': 'Spa Appointment',
      'transportation': 'Transportation',
      'attractions': 'Local Attractions',
      'tours-activities': 'Tours & Activities',
      'technical-support': 'Technical Support',
      'concierge': 'Concierge Services',
      'wellness-fitness': 'Wellness & Fitness',
      'security': 'Security Assistance',
      'special-occasions': 'Special Occasion',
      'other': 'Other Service'
    };
    
    return typeMap[serviceType] || serviceType.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Legacy function to analyze call summary and prepare request items
  useEffect(() => {
    if (isActive && callSummary && orderSummary && (!serviceRequests || serviceRequests.length === 0)) {
      // Extract requests from summary content
      const content = callSummary.content;
      
      // Try to find "List of Requests:" section and extract individual requests
      const requestsMatch = content.match(/List of Requests:([\s\S]*?)(?:\n\nSpecial Instructions|\n\nThe conversation)/);
      
      if (requestsMatch) {
        const requestsSection = requestsMatch[1];
        const requestRegex = /Request (\d+): ([^\n]+)/g;
        
        let match;
        const newItems = [];
        let id = 1;
        
        // Extract all detected service requests
        while ((match = requestRegex.exec(requestsSection)) !== null) {
          const requestType = match[2].trim();
          const requestIndex = match.index;
          const endIndex = requestsSection.indexOf(`Request ${parseInt(match[1]) + 1}:`, requestIndex);
          
          // Extract the details section for this request
          const detailsSection = endIndex > -1 
            ? requestsSection.substring(requestIndex, endIndex)
            : requestsSection.substring(requestIndex);
          
          // Parse specific details
          const detailsRegex = /- ([^:]+): ([^\n]+)/g;
          let detailsMatch;
          const details: Record<string, string> = {};
          
          while ((detailsMatch = detailsRegex.exec(detailsSection)) !== null) {
            const key = detailsMatch[1].trim();
            const value = detailsMatch[2].trim();
            details[key.toLowerCase()] = value;
          }
          
          // Construct comprehensive description including all details
          let description = '';
          
          if (details['service description']) {
            description += `${details['service description']}`;
          }
          
          if (details['details']) {
            description += description ? `. ${details['details']}` : details['details'];
          }
          
          if (details['items']) {
            description += description ? `\nItems: ${details['items']}` : `Items: ${details['items']}`;
          }
          
          if (details['service timing requested']) {
            description += `\nTiming: ${details['service timing requested']}`;
          }
          
          if (details['destinations']) {
            description += `\nDestinations: ${details['destinations']}`;
          }
          
          // If no details were extracted, provide a default description
          if (!description) {
            description = `Requested ${requestType} service`;
          }
          
          newItems.push({
            id: id.toString(),
            name: requestType,
            description: description,
            quantity: 1,
            price: 10 // Default price
          });
          
          id++;
        }
        
        // If we found at least one request and we don't already have items,
        // update the orderSummary with the new items
        if (newItems.length > 0 && (!orderSummary.items || orderSummary.items.length === 0)) {
          // Create a comma-separated list of service types
          const serviceTypes = newItems.map(item => {
            // Convert service name to service type value
            const serviceType = item.name.toLowerCase().replace(/\s+/g, '-');
            return serviceType;
          }).join(',');
          
          // Look for room number in the summary
          const roomMatch = content.match(/Room Number:?\s*(\d+)/i);
          const roomNumber = roomMatch ? roomMatch[1] : orderSummary.roomNumber;
          
          // Look for overall timing
          const timingMatch = content.match(/Service Timing Requested:?\s*([^\n]+)/i);
          const timing = timingMatch ? timingMatch[1] : orderSummary.deliveryTime;
          
          // Map the timing description to our delivery time options
          let deliveryTime = orderSummary.deliveryTime;
          if (timing) {
            if (/soon|immediate|urgent|right now/i.test(timing)) {
              deliveryTime = 'asap';
            } else if (/30 minute|half hour/i.test(timing)) {
              deliveryTime = '30min';
            } else if (/hour|60 minute/i.test(timing)) {
              deliveryTime = '1hour';
            } else if (/schedule|later|specific/i.test(timing)) {
              deliveryTime = 'specific';
            }
          }
          
          setOrderSummary({
            ...orderSummary,
            items: newItems,
            orderType: serviceTypes,
            roomNumber: roomNumber,
            deliveryTime: deliveryTime,
            totalAmount: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          });
        }
      }
    }
  }, [isActive, callSummary, orderSummary, setOrderSummary]);

  // Handle confirm order
  const handleConfirmOrder = async () => {
    if (!orderSummary) return;
    
    // Generate a random order reference
    const orderReference = `#ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Derive display text for estimated delivery time based on orderSummary
    let estimatedDisplayTime: string;
    switch (orderSummary.deliveryTime) {
      case 'asap':
        estimatedDisplayTime = 'As soon as possible';
        break;
      case '30min':
        estimatedDisplayTime = '30 minutes';
        break;
      case '1hour':
        estimatedDisplayTime = '1 hour';
        break;
      default:
        // Use custom or specific time entered by user
        estimatedDisplayTime = orderSummary.deliveryTime || '15-20 minutes';
    }
    
    // Set order data with dynamic estimatedTime
    setOrder({
      reference: orderReference,
      estimatedTime: estimatedDisplayTime,
      summary: orderSummary
    });
    
    // Add to active orders for status panel
    addActiveOrder({
      reference: orderReference,
      requestedAt: new Date(),
      estimatedTime: estimatedDisplayTime
    });
    
    // Check if email has already been sent for this session
    if (emailSentForCurrentSession) {
      console.log('Email already sent for this session. Skipping duplicate email sending.');
      setCurrentInterface('interface4');
      return;
    }
    
    // Only send email from English interface if Vietnamese interface is not active
    // This prevents duplicate emails when both components are rendered
    const isVietnameseActive = document.querySelector('[data-interface="interface3vi"]')?.getAttribute('data-active') === 'true';
    
    if (!isVietnameseActive) {
      // Send email with the order summary
      try {
        console.log('Sending email with call summary and service requests...');
        // Translate summary to Vietnamese for email
        let summaryForEmail = callSummary?.content || '';
        try {
          summaryForEmail = await translateToVietnamese(summaryForEmail);
        } catch (e) {
          console.error('Failed to translate summary for email:', e);
        }
        // Log the translated summary so you can inspect its content
        console.log('Translated summary for email (Vietnamese):', summaryForEmail);
        
        // Format call duration if available - ensure we have valid values even on mobile
        const formattedDuration = callDuration ? 
          `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 
          '0:00';
          
        console.log('Call duration for email:', formattedDuration);
        
        // Ensure we have a valid callId for both desktop and mobile
        const generatedCallId = `call-${Date.now()}`;
        const currentCallId = callDetails?.id || generatedCallId;
        
        console.log('Using callId for email:', currentCallId);
        console.log('Call summary content:', callSummary?.content || 'No summary available');
        
        console.log('Preparing email request payload...');
        const emailPayload = {
          toEmail: 'tuans2@gmail.com', // Default email recipient
          callDetails: {
            callId: currentCallId,
            roomNumber: orderSummary.roomNumber || 'unknown',
            summary: summaryForEmail || 'No summary available',
            timestamp: callSummary?.timestamp || new Date(),
            duration: formattedDuration,
            serviceRequests: orderSummary.items.map(item => item.name),
            orderReference: orderReference,
            note: note // User-provided additional notes
          }
        };
        console.log('Email payload prepared:', JSON.stringify(emailPayload));
        
        // Use a timeout to ensure the request is properly sent on mobile
        // Phát hiện thiết bị di động ngay từ đầu
        const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry/i.test(navigator.userAgent);
        console.log('Device type detected:', isMobile ? 'MOBILE' : 'DESKTOP');
            
        setTimeout(async () => {
          try {
            // Chọn endpoint phù hợp với loại thiết bị
            const endpoint = isMobile ? '/api/mobile-call-summary-email' : '/api/send-call-summary-email';
            console.log(`Using ${isMobile ? 'mobile' : 'standard'} endpoint for email: ${endpoint}`);
            
            // Thêm timestamp để tránh cache trên thiết bị di động
            const requestUrl = isMobile ? `${endpoint}?_=${Date.now()}` : endpoint;
            
            console.log('Sending email request to server...');
            const response = await fetch(requestUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache', 
                'Expires': '0',
                'X-Device-Type': isMobile ? 'mobile' : 'desktop'
              },
              body: JSON.stringify(emailPayload),
              cache: 'no-cache',
              credentials: 'same-origin',
            });
            
            if (!response.ok) {
              throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Email sent with order confirmation:', result);
            
            // Mark that email has been sent for this session to prevent duplicates
            setEmailSentForCurrentSession(true);
          } catch (innerError) {
            console.error('Failed to send email in timeout:', innerError);
          }
        }, isMobile ? 50 : 500); // Giảm thời gian timeout cho thiết bị di động

      } catch (error) {
        console.error('Failed to send email:', error);
      }
    } else {
      console.log('Vietnamese interface is active, skipping email send from English interface');
    }
    
    // Navigate to confirmation screen
    setCurrentInterface('interface4');
  };
  
  // Function to add note to the displayed summary
  const handleAddNote = () => {
    if (!note.trim() || !callSummary) return;
    setCallSummary({
      ...callSummary,
      content: `${callSummary.content}\n\nAdditional Notes:\n${note}`
    });
  };
  
  if (!orderSummary) return null;
  
  return (
    <div
      className={`absolute w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-30 overflow-y-auto`}
      id="interface3"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 35, 126, 0.8), rgba(63, 81, 181, 0.8)), url(${hotelImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: 'SF Pro Text, Roboto, Open Sans, Arial, sans-serif'
      }}
    >
      <div className="container mx-auto h-full flex flex-col p-2 sm:p-4 md:p-8">
        <div className="mx-auto w-full max-w-4xl bg-white/90 rounded-2xl shadow-xl p-3 sm:p-6 md:p-10 mb-4 sm:mb-6 flex-grow border border-white/40 backdrop-blur-md" style={{minHeight: 420}}>
          <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
            <p className="font-poppins font-bold text-xl sm:text-2xl text-blue-900 tracking-wide">REVIEW & CONFIRM</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 sm:gap-10 md:gap-16">
            {/* Left column: summary, notes, room number */}
            <div className="md:w-3/4 w-full space-y-3 sm:space-y-4">
              {/* AI-generated Call Summary Container */}
              {callSummary && (
                <div id="summary-container" className="mb-3 sm:mb-4">
                  <div className="p-3 sm:p-5 bg-white/80 rounded-xl shadow border border-white/30 mb-3 sm:mb-4 relative" style={{backdropFilter:'blur(2px)'}}>
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-blue-800">Summary</h3>
                    <p className="text-sm sm:text-base leading-relaxed text-gray-800 whitespace-pre-line" style={{fontWeight: 400}}>{callSummary.content}</p>
                    <div className="mt-2 sm:mt-3 flex justify-end">
                      <div className="text-xs text-gray-500">
                        Generated at {new Date(callSummary.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Additional Notes and Actions */}
              <div className="flex items-center justify-between h-10">
                <button className="h-full px-3 sm:px-4 bg-[#ffe082] hover:bg-[#ffe9b3] text-blue-900 rounded-full text-xs sm:text-sm font-semibold shadow transition-colors" onClick={handleAddNote} disabled={!note.trim()}>Add Note</button>
                <button className="h-full px-3 sm:px-4 bg-white/70 text-blue-900 rounded-full text-xs sm:text-sm font-semibold border border-white/30 shadow flex items-center justify-center" onClick={() => setCurrentInterface('interface3vi')}>
                  <span className="material-icons text-base">language</span>
                </button>
              </div>
              <textarea placeholder="Enter any corrections or additional Information & Press Add Note to update into the Conversation Summary" className="w-full p-2 sm:p-3 border border-white/30 rounded-xl mb-3 sm:mb-4 text-xs sm:text-sm bg-white/60 focus:bg-white/90 focus:ring-2 focus:ring-[#d4af37] transition italic font-light text-gray-500" value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{fontFamily:'inherit'}} />
              {/* Room Number input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm sm:text-base text-gray-600 font-medium">Room Number</label>
                <input type="text" className="w-24 sm:w-32 p-2 border border-white/30 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] bg-white/70 text-gray-900 font-semibold" value={orderSummary.roomNumber} onChange={(e) => handleInputChange('roomNumber', e.target.value)} />
                <span className="italic text-xs text-gray-400 ml-2">*Required in order to help our reception to process your request</span>
              </div>
            </div>
            {/* Right column: control buttons at top-right */}
            <div className="md:w-1/4 w-full flex md:justify-end justify-center">
              <div className="flex flex-col items-end space-y-2 sm:space-y-3 w-full md:w-auto">
                <button className="w-full md:w-auto flex items-center justify-center px-2 sm:px-3 py-1.5 bg-white/80 hover:bg-blue-100 text-blue-900 rounded-full text-xs font-semibold border border-white/30 shadow transition-colors" onClick={() => setCurrentInterface('interface1')}>
                  <span className="material-icons text-base mr-1">cancel</span>Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="w-full md:w-auto bg-[#d4af37] hover:bg-[#ffd700] text-blue-900 font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-full shadow-lg flex items-center justify-center space-x-2 transition-colors border border-white/30 text-xs sm:text-sm"
                  style={{letterSpacing:0.5}}
                >
                  <span className="material-icons">send</span>
                  <span className="whitespace-nowrap">Send To Reception</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface3;
