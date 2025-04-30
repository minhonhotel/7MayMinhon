import React, { useState, useEffect } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import hotelImage from '../assets/hotel-exterior.jpeg';

interface Interface1Props {
  isActive: boolean;
}

const Interface1: React.FC<Interface1Props> = ({ isActive }) => {
  const { startCall, activeOrders } = useAssistant();
  
  // Track current time for countdown calculations
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className={`absolute w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } z-10`} 
      id="interface1"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 35, 126, 0.8), rgba(63, 81, 181, 0.8)), url(${hotelImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="container mx-auto h-full flex flex-col items-center justify-start text-white p-5 pt-10 lg:pt-16 overflow-y-auto">
        {/* Active orders status panels (up to 60 min countdown) */}
        {activeOrders.map((o) => {
          const deadline = new Date(o.requestedAt.getTime() + 60 * 60 * 1000);
          const diffSec = Math.max(Math.ceil((deadline.getTime() - now.getTime()) / 1000), 0);
          if (diffSec <= 0) return null;
          const mins = Math.floor(diffSec / 60).toString().padStart(2, '0');
          const secs = (diffSec % 60).toString().padStart(2, '0');
          return (
            <div key={o.reference} className="bg-white/80 backdrop-blur-sm p-3 rounded-md mb-4 text-gray-800 shadow-md max-w-sm w-full">
              <p className="text-sm mb-1"><strong>Order Ref:</strong> {o.reference}</p>
              <p className="text-sm mb-1"><strong>Requested At:</strong> {o.requestedAt.toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
              <p className="text-sm mb-1"><strong>Estimated Completion:</strong> {o.estimatedTime}</p>
              <p className="text-sm"><strong>Time Remaining:</strong> {`${mins}:${secs}`}</p>
            </div>
          );
        })}
        <h2 className="font-poppins font-bold text-3xl lg:text-4xl text-amber-400 mb-2 text-center">Mi Nhon Hotel Mui Ne</h2>
        <p className="text-lg lg:text-xl text-center max-w-lg mb-8">AI-powered Voice Assistant - Supporting All Your Needs</p>
        
        {/* Main Call Button */}
        <div className="relative mb-12">
          {/* Ripple Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-[ripple_1.5s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/70 animate-[ripple_2s_linear_infinite]"></div>
          
          {/* Main Button */}
          <button 
            id="vapiButton" 
            className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-primary-dark font-poppins font-bold flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-300" 
            onClick={startCall}
          >
            <span className="material-icons text-4xl lg:text-5xl mb-1">mic</span>
            <span className="text-sm lg:text-base font-medium">Press to Call</span>
          </button>
        </div>
        {/* Services Section */}
        <div className="text-center w-full max-w-5xl">
          <div className="flex flex-row flex-wrap justify-center gap-3 text-left mx-auto">
            {/* Room & Stay */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Room & Stay</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Check-in/check-out</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Room extension</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Room information</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Hotel policies</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Wi-Fi & FAQ</span></li>
              </ul>
            </div>
            {/* Room Services */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Room Services</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Food & beverages</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Mini bar service</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Housekeeping</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Laundry</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Wake-up service</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Additional amenities</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Technical assistance</span></li>
              </ul>
            </div>
            {/* Bookings & Facilities */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Bookings & Facilities</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Restaurant reservations</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Spa/massage appointments</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Gym facilities</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Swimming pool</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Transportation</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Medical assistance</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Special assistance</span></li>
              </ul>
            </div>
            {/* Tourism & Exploration */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Tourism & Exploration</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Nearby attractions</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Local restaurants</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Public transportation</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Car rental</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Weather & Events</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Shopping</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Tours</span></li>
              </ul>
            </div>
            {/* Support */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Support</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Language assistance</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Feedback & Reviews</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Emergency support</span></li>
                <li className="flex items-start"><span className="material-icons text-amber-400 mr-1 mt-0.5 text-base">arrow_forward</span><span>Luggage service</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface1;
