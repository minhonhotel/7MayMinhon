import React, { useEffect, useState, useCallback } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import { ServiceRequest } from '@/types';
import hotelImage from '../assets/hotel-exterior.jpeg';
import { extractRequests, validateRequest, normalizeRequestType } from '../utils/requestExtractor';
import { SummaryErrorBoundary } from './SummaryErrorBoundary';
import { getCachedTranslation } from '../utils/translationCache';
import { OrderSummary, OrderItem } from '../types';
import { analyzeServiceRequests, exportSummary } from '../utils/summaryUtils';

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
  const [groupedRequests, setGroupedRequests] = useState<Record<string, string[]>>({});
  // State for user-provided additional notes
  const [userNotes, setUserNotes] = useState<string>('');
  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  const processCallSummary = useCallback(async () => {
    if (!callSummary?.content || !orderSummary) return;

    try {
      setIsProcessing(true);
      
      // Analyze the summary content
      const { requests, groupedByType, stats } = analyzeServiceRequests(callSummary.content);
      
      // Calculate total amount based on service types
      const basePrices: Record<string, number> = {
        'room-service': 15,
        'housekeeping': 8,
        'transportation': 25,
        'tours-activities': 35,
        'spa': 30,
        'other': 10
      };

      const items = requests.map((req, index) => {
        const type = normalizeRequestType(req.type);
        const price = basePrices[type] || basePrices.other;
        const quantity = parseInt(req.details.amount) || 1;

        return {
          id: (index + 1).toString(),
          name: req.text.length > 60 ? req.text.substring(0, 57) + '...' : req.text,
          description: Object.entries(req.details)
            .filter(([key, value]) => value && key !== 'otherDetails')
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n'),
          quantity,
          price,
          serviceType: type
        };
      });

      // Get unique service types
      const serviceTypes = Array.from(new Set(
        requests.map(req => normalizeRequestType(req.type))
      )).join(',');

      // Determine delivery time based on stats
      let deliveryTime: 'asap' | '30min' | '1hour' | 'specific' = 'specific';
      if (stats.byType.some(t => t.hasUrgentRequests)) {
        deliveryTime = 'asap';
      }

      const newOrderSummary: OrderSummary = {
        ...orderSummary,
        orderType: serviceTypes || 'general',
        deliveryTime,
        roomNumber: requests.find(r => r.details.roomNumber)?.details.roomNumber || orderSummary.roomNumber || 'Not specified',
        items,
        totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        guestName: orderSummary.guestName || 'Guest',
        guestEmail: orderSummary.guestEmail || '',
        guestPhone: orderSummary.guestPhone || '',
        specialInstructions: orderSummary.specialInstructions || ''
      };

      // Update grouped requests for display
      const grouped = Object.entries(groupedByType).reduce((acc, [type, reqs]) => {
        acc[type] = reqs.map(r => r.text);
        return acc;
      }, {} as Record<string, string[]>);

      setGroupedRequests(grouped);
      setOrderSummary(newOrderSummary);
    } catch (error) {
      console.error('Error processing call summary:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [callSummary, orderSummary, setOrderSummary]);

  useEffect(() => {
    if (isActive) {
      processCallSummary();
    }
  }, [isActive, processCallSummary]);
  
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
  
  // Handle confirm order
  const handleConfirmOrder = async () => {
    if (!orderSummary) return;
    
    // Generate a random order reference
    const orderReference = `#ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Derive display text for estimated delivery time
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
        estimatedDisplayTime = orderSummary.deliveryTime || '15-20 minutes';
    }
    
    setOrder({
      reference: orderReference,
      estimatedTime: estimatedDisplayTime,
      summary: orderSummary
    });
    
    addActiveOrder({
      reference: orderReference,
      requestedAt: new Date(),
      estimatedTime: estimatedDisplayTime
    });
    
    // Handle email sending
    if (!emailSentForCurrentSession) {
      try {
        const summaryForEmail = await translateToVietnamese(callSummary?.content || '');
        const formattedDuration = callDuration ? 
          `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 
          '0:00';
          
        const currentCallId = callDetails?.id || `call-${Date.now()}`;
        
        const emailPayload = {
          toEmail: 'tuans2@gmail.com',
          callDetails: {
            callId: currentCallId,
            roomNumber: orderSummary.roomNumber || 'unknown',
            summary: summaryForEmail || 'No summary available',
            timestamp: callSummary?.timestamp || new Date(),
            duration: formattedDuration,
            serviceRequests: orderSummary.items.map(item => item.name),
            orderReference: orderReference,
            note: userNotes
          }
        };
        
        const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry/i.test(navigator.userAgent);
        const endpoint = isMobile ? '/api/mobile-call-summary-email' : '/api/send-call-summary-email';
        const requestUrl = isMobile ? `${endpoint}?_=${Date.now()}` : endpoint;
        
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
        
        setEmailSentForCurrentSession(true);
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }
    
    setCurrentInterface('interface4');
  };
  
  // Function to add note to the displayed summary
  const handleAddNote = () => {
    if (!userNotes.trim() || !callSummary) return;
    setCallSummary({
      ...callSummary,
      content: `${callSummary.content}\n\nAdditional Notes:\n${userNotes}`
    });
  };

  // Handle export summary
  const handleExportSummary = () => {
    if (!callSummary || !orderSummary) return;
    exportSummary(callSummary, orderSummary, groupedRequests, userNotes);
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
                {isProcessing ? (
                  <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ) : callSummary ? (
                  <div className="p-4 bg-blue-50 rounded-lg shadow-sm mb-4 relative">
                    <h3 className="font-medium text-base mb-2 text-blue-800">Conversation Summary</h3>
                    <p className="text-sm leading-snug text-gray-700 whitespace-pre-line">{callSummary.content}</p>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <button
                        onClick={handleExportSummary}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <span className="material-icons text-sm mr-1">download</span>
                        Export Summary
                      </button>
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
                <button 
                  className="h-full px-3 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-300" 
                  onClick={handleAddNote} 
                  disabled={!userNotes.trim()}
                >
                  Add Note
                </button>
                <button 
                  className="h-full px-3 bg-blue-50 text-primary rounded-lg text-sm font-medium" 
                  onClick={() => setCurrentInterface('interface3vi')}
                >
                  Vietnamese
                </button>
              </div>
              <textarea 
                placeholder="Enter any corrections or additional Information & Press Add Note to update into the Conversation Summary" 
                className="w-full p-2 border rounded-lg mb-4 text-sm md:text-base" 
                value={userNotes} 
                onChange={(e) => setUserNotes(e.target.value)} 
                rows={3} 
              />
              {/* Room Number input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-500">Room Number</label>
                <input 
                  type="text" 
                  className="w-32 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary" 
                  value={orderSummary.roomNumber} 
                  onChange={(e) => handleInputChange('roomNumber', e.target.value)} 
                />
              </div>
            </div>
            {/* Right column: control buttons at top-right */}
            <div className="w-1/4 flex justify-end">
              <div className="flex flex-col items-end space-y-2">
                <button 
                  className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs" 
                  onClick={() => setCurrentInterface('interface2')}
                >
                  <span className="material-icons text-sm mr-1">arrow_back</span>Back
                </button>
                <button 
                  className="w-full lg:w-auto flex items-center justify-center px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs" 
                  onClick={() => setCurrentInterface('interface1')}
                >
                  <span className="material-icons text-sm mr-1">cancel</span>Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <span className="material-icons">send</span>
                  <span>Press Here to Send Your Request To Receptionist</span>
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
