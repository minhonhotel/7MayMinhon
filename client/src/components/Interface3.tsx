import React, { useEffect, useState } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import { ServiceRequest } from '@/types';
import hotelImage from '../assets/hotel-exterior.jpeg';

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
          
          // Summarize details into a comprehensive description
          // Start with a clean request text
          let description = "";
          
          // Create a more structured and readable format with all available details
          // Important information first
          if (details.roomNumber && details.roomNumber !== "unknown" && details.roomNumber !== "Not specified") 
            description += `Room Number: ${details.roomNumber}\n`;
            
          if (details.date && details.date !== "Not specified") 
            description += `Date: ${details.date}\n`;
            
          if (details.time && details.time !== "Not specified") 
            description += `Time: ${details.time}\n`;
          
          // Add secondary but still critical information
          if (details.people) {
            // people is a number in the type definition, so just use it directly
            description += `Number of People: ${details.people}\n`;
          }
          
          if (details.location && details.location !== "Not specified") 
            description += `Location: ${details.location}\n`;
            
          if (details.amount && details.amount !== "Not specified") 
            description += `Amount: ${details.amount}\n`;
          
          // Add the full request details at the end
          description += `\nRequest: ${request.requestText}`;
          
          // Add any additional details last, but only if they're meaningful
          if (details.otherDetails && 
              details.otherDetails !== "Not specified" && 
              details.otherDetails !== "None" &&
              !details.otherDetails.includes("Not specified"))
            description += `\n\nAdditional Details: ${details.otherDetails}`;
          
          return {
            id: (index + 1).toString(),
            name: request.requestText.length > 60 
              ? request.requestText.substring(0, 57) + '...' 
              : request.requestText,
            description: description,
            quantity: quantity,
            price: price,
            serviceType: request.serviceType
          };
        });
        
        // Create a comma-separated list of unique service types
        const uniqueServiceTypes = Array.from(new Set(serviceRequests.map(r => r.serviceType)));
        const serviceTypes = uniqueServiceTypes.join(',');
        
        // Determine delivery time based on most urgent request
        let deliveryTime = orderSummary.deliveryTime;
        if (serviceRequests.some(r => 
            r.details && 
            r.details.time && 
            typeof r.details.time === 'string' && 
            r.details.time.toLowerCase().includes('immediate'))) {
          deliveryTime = 'asap';
        }
        
        // Get room number if available
        const roomNumberDetail = serviceRequests.find(r => 
          r.details && 
          r.details.roomNumber && 
          r.details.roomNumber !== "unknown" && 
          r.details.roomNumber !== "Not specified"
        )?.details?.roomNumber;
        
        // Update order summary with new items and enhanced info
        setOrderSummary({
          ...orderSummary,
          items: newItems,
          totalAmount: newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          orderType: serviceTypes, // Update service types from detected categories
          roomNumber: roomNumberDetail || orderSummary.roomNumber,
          deliveryTime: deliveryTime // Update delivery time based on detected urgency
        });
      }
    }
  }, [serviceRequests, isActive, orderSummary, setOrderSummary]);
  
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
      } z-30`}
      id="interface3"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 35, 126, 0.8), rgba(63, 81, 181, 0.8)), url(${hotelImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto h-full flex flex-col p-5">
        <div className="bg-white rounded-lg shadow-md p-5 mb-5 flex-grow overflow-auto">
          <div className="mb-4 pb-3 border-b border-gray-200">
            <p className="font-poppins font-bold text-lg text-primary">REVIEW & CONFIRM</p>
          </div>
          <div className="flex flex-row gap-4">
            {/* Left column: summary, notes, room number */}
            <div className="w-3/4 space-y-4">
              {/* AI-generated Call Summary Container */}
              <div id="summary-container" className="mb-4">
                {callSummary ? (
                  <div className="p-4 bg-blue-50 rounded-lg shadow-sm mb-4 relative">
                    <h3 className="font-medium text-base mb-2 text-blue-800">Conversation Summary</h3>
                    <p className="text-sm leading-snug text-gray-700 whitespace-pre-line">{callSummary.content}</p>
                    
                    <div className="mt-3 flex justify-end">
                      <div className="text-xs text-gray-500">
                        Generated at {new Date(callSummary.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm mb-4 border border-dashed border-gray-300">
                    <div className="animate-pulse flex space-x-2 items-center">
                      <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    </div>
                    <h3 className="font-medium text-lg my-2 text-gray-600">Generating Summary...</h3>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <p className="text-gray-400 italic mt-3">Our AI is analyzing your conversation and preparing a summary...</p>
                  </div>
                )}
              </div>
              {/* Additional Notes and Actions */}
              <div className="flex items-center justify-between h-10">
                <button className="h-full px-3 bg-blue-500 text-white rounded-lg text-sm font-medium" onClick={handleAddNote} disabled={!note.trim()}>Add Note</button>
                <button className="h-full px-3 bg-blue-50 text-primary rounded-lg text-sm font-medium" onClick={() => setCurrentInterface('interface3vi')}>Vietnamese</button>
              </div>
              <textarea placeholder="Enter any corrections or additional Information & Press Add Note to update into the Conversation Summary" className="w-full p-2 border rounded-lg mb-4 text-sm md:text-base" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              {/* Room Number input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-500">Room Number</label>
                <input type="text" className="w-32 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary" value={orderSummary.roomNumber} onChange={(e) => handleInputChange('roomNumber', e.target.value)} />
              </div>
            </div>
            {/* Right column: control buttons at top-right */}
            <div className="w-1/4 flex justify-end">
              <div className="flex flex-col items-end space-y-2">
                <button className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs" onClick={() => setCurrentInterface('interface2')}>
                  <span className="material-icons text-sm mr-1">arrow_back</span>Back
                </button>
                <button className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs" onClick={() => setCurrentInterface('interface1')}>
                  <span className="material-icons text-sm mr-1">cancel</span>Cancel
                </button>
                <button id="confirmOrderButton" className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs" onClick={handleConfirmOrder}>
                  <span className="material-icons text-sm mr-1">check_circle</span>Confirm
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
