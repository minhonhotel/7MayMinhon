import React, { useEffect, useState } from 'react';
import { useAssistant } from '../context/AssistantContext';
import { ServiceRequest } from '../types';

interface Interface3ViProps {
  isActive: boolean;
}

const Interface3Vi: React.FC<Interface3ViProps> = ({ isActive }) => {
  const { 
    callSummary, 
    orderSummary, 
    setCurrentInterface, 
    setOrderSummary,
    setOrder,
    serviceRequests,
    vietnameseSummary,
    setVietnameseSummary,
    translateToVietnamese,
    emailSentForCurrentSession,
    setEmailSentForCurrentSession,
    callDetails,
    callDuration
  } = useAssistant();
  
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    if (!orderSummary) return;
    
    setOrderSummary({
      ...orderSummary,
      [field]: value
    });
  };

  // Request Vietnamese translation when component becomes active
  // Store the call summary id to prevent unnecessary translation requests
  const [processedSummaryId, setProcessedSummaryId] = useState<string | null>(null);
  
  useEffect(() => {
    // Only translate if:
    // 1. Component is active
    // 2. We have a summary
    // 3. We don't already have a Vietnamese translation OR we have a new summary
    // 4. We haven't processed this specific summary before (using timestamp as ID)
    const summaryId = callSummary ? new Date(callSummary.timestamp).getTime().toString() : null;
    
    if (
      isActive && 
      callSummary && 
      (!vietnameseSummary || processedSummaryId !== summaryId) &&
      summaryId !== processedSummaryId
    ) {
      // Update the processed summary id to prevent multiple translations
      setProcessedSummaryId(summaryId);
      
      const translateSummary = async () => {
        try {
          console.log('Starting translation of summary to Vietnamese');
          setIsTranslating(true);
          await translateToVietnamese(callSummary.content);
          setIsTranslating(false);
        } catch (error) {
          console.error('Error translating summary:', error);
          setIsTranslating(false);
        }
      };
      
      translateSummary();
    }
  }, [isActive, callSummary, vietnameseSummary, translateToVietnamese, processedSummaryId]);

  // Enhance order items with service request details
  useEffect(() => {
    if (isActive && serviceRequests && serviceRequests.length > 0 && orderSummary) {
      const newItems = serviceRequests.map((request: ServiceRequest, index: number) => {
        // Default values for items that might not have details
        let quantity = 1;
        let price = 10;
        
        // Adjust price based on service type
        if (request.serviceType === 'housekeeping') price = 5;
        if (request.serviceType === 'technical-support') price = 0;
        if (request.serviceType.includes('food') || request.serviceType === 'room-service') price = 8;
        if (request.serviceType === 'wake-up') price = 0;
        
        // Construct comprehensive description for the item
        let description = '';
        
        // Add the most important details first
        const details = request.details;
        
        if (details.roomNumber && details.roomNumber !== "unknown" && details.roomNumber !== "Not specified") 
          description += `Số phòng: ${details.roomNumber}\n`;
          
        if (details.date && details.date !== "Not specified") 
          description += `Ngày: ${details.date}\n`;
          
        if (details.time && details.time !== "Not specified") 
          description += `Thời gian: ${details.time}\n`;
        
        // Add secondary but still critical information
        if (details.people) {
          // people is a number in the type definition, so just use it directly
          description += `Số người: ${details.people}\n`;
        }
        
        if (details.location && details.location !== "Not specified") 
          description += `Địa điểm: ${details.location}\n`;
          
        if (details.amount && details.amount !== "Not specified") 
          description += `Số tiền: ${details.amount}\n`;
        
        // Add the full request details at the end
        description += `\nYêu cầu: ${request.requestText}`;
        
        // Add any additional details last, but only if they're meaningful
        if (details.otherDetails && 
            details.otherDetails !== "Not specified" && 
            details.otherDetails !== "None" &&
            !details.otherDetails.includes("Not specified"))
          description += `\n\nThông tin thêm: ${details.otherDetails}`;
        
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
  }, [serviceRequests, isActive, orderSummary, setOrderSummary]);
  
  // Helper function to get readable service name from service type
  const getServiceName = (serviceType: string): string => {
    const typeMap: Record<string, string> = {
      'room-service': 'Dịch vụ phòng',
      'housekeeping': 'Dịch vụ buồng phòng',
      'wake-up': 'Cuộc gọi đánh thức',
      'amenities': 'Tiện nghi bổ sung',
      'restaurant': 'Đặt chỗ nhà hàng',
      'spa': 'Dịch vụ Spa',
      'transportation': 'Phương tiện vận chuyển',
      'attractions': 'Điểm tham quan địa phương',
      'tours-activities': 'Tour & hoạt động',
      'technical-support': 'Hỗ trợ kỹ thuật',
      'concierge': 'Dịch vụ lễ tân',
      'wellness-fitness': 'Sức khỏe & Thể dục',
      'security': 'Hỗ trợ an ninh',
      'special-occasions': 'Dịp đặc biệt',
      'other': 'Dịch vụ khác'
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
    
    // Set order data
    setOrder({
      reference: orderReference,
      estimatedTime: '15-20 phút',
      summary: orderSummary
    });
    
    // Check if email has already been sent for this session
    if (emailSentForCurrentSession) {
      console.log('Email đã được gửi cho phiên này. Bỏ qua việc gửi email trùng lặp.');
      setCurrentInterface('interface4');
      return;
    }
    
    // Send email with the order summary - OK to always send from Vietnamese interface
    try {
      console.log('Gửi email với tóm tắt cuộc gọi và yêu cầu dịch vụ từ giao diện tiếng Việt...');
      
      // Format call duration if available - more defensive code for mobile
      const formattedDuration = callDuration ? 
        `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 
        '0:00';
      
      // Ensure we have a valid callId for both desktop and mobile
      const generatedCallId = `call-${Date.now()}`;
      const currentCallId = callDetails?.id || generatedCallId;
      
      console.log('Sử dụng callId cho email:', currentCallId);
      console.log('Nội dung tóm tắt cuộc gọi:', vietnameseSummary || (callSummary ? callSummary.content : 'Không có tóm tắt'));
      
      console.log('Chuẩn bị payload email...');
      const emailPayload = {
        toEmail: 'tuans2@gmail.com', // Default email recipient
        callDetails: {
          callId: currentCallId,
          roomNumber: orderSummary.roomNumber || 'Cần xác nhận',
          summary: vietnameseSummary || (callSummary ? callSummary.content : 'Không có tóm tắt'),
          timestamp: callSummary ? callSummary.timestamp : new Date(),
          duration: formattedDuration,
          serviceRequests: orderSummary.items.map(item => item.name), 
          orderReference: orderReference
        }
      };
      console.log('Payload email đã chuẩn bị:', JSON.stringify(emailPayload));
      
      // Use a timeout to ensure the request is properly sent on mobile
      setTimeout(async () => {
        try {
          console.log('Gửi yêu cầu email đến máy chủ...');
          const response = await fetch('/api/send-call-summary-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
            // Add cache control headers to prevent caching of request
            cache: 'no-cache',
            credentials: 'same-origin',
          });
          
          if (!response.ok) {
            throw new Error(`Máy chủ phản hồi với trạng thái: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Email đã được gửi với xác nhận đơn hàng:', result);
          
          // Mark that email has been sent for this session to prevent duplicates
          setEmailSentForCurrentSession(true);
        } catch (innerError) {
          console.error('Không thể gửi email trong timeout:', innerError);
        }
      }, 500);
    } catch (error) {
      console.error('Không thể gửi email:', error);
    }
    
    // Navigate to confirmation screen
    setCurrentInterface('interface4');
  };
  
  if (!orderSummary) return null;
  
  return (
    <div className={`absolute w-full h-full transition-opacity duration-500 ${
      isActive ? 'opacity-100 active' : 'opacity-0 pointer-events-none'
    } bg-neutral z-30`} id="interface3vi" data-interface="interface3vi" data-active={isActive.toString()}>
      <div className="container mx-auto h-full flex flex-col p-5">
        <div className="bg-white rounded-lg shadow-md p-5 mb-5 flex-grow overflow-auto">
          <div className="mb-4 pb-3 border-b border-gray-200">
            <p className="font-poppins font-bold text-lg text-primary">XEM XÉT & XÁC NHẬN</p>
          </div>
          
          {/* AI-generated Call Summary Container */}
          <div id="summary-container" className="mb-4">
            {callSummary ? (
              <div className="p-4 bg-blue-50 rounded-lg shadow-sm mb-4 relative">
                <div className="absolute top-2 right-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span>AI Tự động</span>
                </div>
                <h3 className="font-medium text-lg mb-2 text-blue-800">Tóm tắt cuộc trò chuyện</h3>
                {isTranslating ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-2 bg-blue-100 rounded w-3/4"></div>
                    <div className="h-2 bg-blue-100 rounded w-full"></div>
                    <div className="h-2 bg-blue-100 rounded w-5/6"></div>
                    <div className="h-2 bg-blue-100 rounded w-2/3"></div>
                    <p className="text-blue-400 text-sm italic">Đang dịch sang tiếng Việt...</p>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-line">
                    {vietnameseSummary || callSummary.content}
                  </p>
                )}
                
                <div className="mt-3 flex justify-end">
                  <div className="text-xs text-gray-500">
                    Tạo lúc {new Date(callSummary.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg shadow-sm mb-4 border border-dashed border-gray-300">
                <div className="animate-pulse flex space-x-2 items-center">
                  <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                </div>
                <h3 className="font-medium text-lg my-2 text-gray-600">Đang tạo bản tóm tắt...</h3>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                </div>
                <p className="text-gray-400 italic mt-3">AI của chúng tôi đang phân tích cuộc trò chuyện và chuẩn bị bản tóm tắt...</p>
              </div>
            )}
          </div>
          
          {/* Service Requests Container */}
          <div id="summaryContainer" className="mb-6">
            {/* Service requests processed - hidden but functional */}
            
            {/* Room Information Section */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-1">
                  <p className="text-sm text-gray-500 mb-1">Số phòng</p>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                    value={orderSummary.roomNumber}
                    onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <p className="text-sm text-gray-500 mb-1">Thời gian yêu cầu dịch vụ</p>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
                    value={orderSummary.deliveryTime}
                    onChange={(e) => handleInputChange('deliveryTime', e.target.value as any)}
                  >
                    <option value="asap">Càng sớm càng tốt</option>
                    <option value="30min">Trong vòng 30 phút</option>
                    <option value="1hour">Trong vòng 1 giờ</option>
                    <option value="specific">Đặt lịch sau</option>
                    <option value="info">Chỉ thông tin - không yêu cầu thời gian</option>
                  </select>
                </div>
              </div>
              

            </div>
            
            {/* Request placeholder - hidden but data still processed */}
            <div className="hidden">
              {orderSummary.items.length > 0 && (
                <div>
                  {orderSummary.items.map((item, index) => (
                    <div key={item.id}>
                      {/* Hidden but functional item data */}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Hidden special instructions - data is preserved but not displayed */}
            <div className="hidden">
              {orderSummary.specialInstructions}
            </div>
            
            {/* Hidden total amount calculation - not displayed */}
            <div className="hidden">
              {orderSummary.totalAmount.toFixed(2)}
            </div>
          </div>
          
          {/* Action Buttons - Responsive design for mobile */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button 
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center"
              onClick={() => setCurrentInterface('interface3')}
            >
              <span className="material-icons text-sm align-middle mr-1">translate</span>
              Tiếng Anh
            </button>
            <button 
              id="confirmOrderButton" 
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium flex items-center"
              onClick={handleConfirmOrder}
            >
              <span className="material-icons text-sm align-middle mr-1">check_circle</span>
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface3Vi;