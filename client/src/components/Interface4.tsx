import React from 'react';
import { useAssistant } from '@/context/AssistantContext';

interface Interface4Props {
  isActive: boolean;
}

const Interface4: React.FC<Interface4Props> = ({ isActive }) => {
  const { order, setCurrentInterface } = useAssistant();
  
  const handleReturnHome = () => {
    setCurrentInterface('interface1');
  };
  
  if (!order) return null;
  
  return (
    <div className={`absolute w-full h-full transition-opacity duration-500 ${
      isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
    } bg-neutral z-40`} id="interface4">
      <div className="container mx-auto h-full flex flex-col items-center justify-center p-3 sm:p-5 text-center">
        <div className="w-full max-w-xs sm:max-w-md bg-white rounded-lg shadow-lg p-4 sm:p-8">
          {/* Success Animation */}
          <div className="mb-4 sm:mb-6 flex justify-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-green-500 flex items-center justify-center">
              <span className="material-icons text-white text-4xl sm:text-5xl">check</span>
            </div>
          </div>
          <h2 className="font-poppins font-bold text-xl sm:text-2xl text-primary mb-2 sm:mb-3">Order Confirmed!</h2>
          <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">Your request has been confirmed and forwarded to our staff. They will process it right away.</p>
          {/* Order Tracking Info */}
          <div className="bg-neutral p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
            <p className="font-medium text-gray-800 text-sm sm:text-base">Order Reference: <span className="font-bold">{order.reference}</span></p>
          </div>
          {/* Estimated Time */}
          <div className="mb-4 sm:mb-6">
            <p className="text-gray-600 text-xs sm:text-sm">Estimated delivery time:</p>
            <p className="font-poppins font-bold text-lg sm:text-xl">{order.estimatedTime}</p>
          </div>
          {/* Return to Home Button */}
          <button 
            className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-amber-400 text-primary-dark rounded-lg font-poppins font-medium text-sm sm:text-base"
            onClick={handleReturnHome}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Interface4;
