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
        <div className="relative mb-12 flex items-center justify-center">
          {/* Ripple Animation (luôn hiển thị, mạnh hơn khi hover) */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400 animate-[ripple_1.5s_linear_infinite] pointer-events-none transition-opacity duration-300 group-hover:opacity-80 opacity-60"></div>
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/70 animate-[ripple_2s_linear_infinite] pointer-events-none transition-opacity duration-300 group-hover:opacity-60 opacity-40"></div>
          {/* Main Button */}
          <button 
            id="vapiButton" 
            className="group relative w-40 h-40 lg:w-56 lg:h-56 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-primary-dark font-poppins font-bold flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-amber-300 overflow-hidden"
            onClick={startCall}
          >
            <span className="material-icons text-6xl lg:text-7xl mb-2 animate-mic-pulse group-hover:animate-mic-bounce text-shadow-lg">mic</span>
            <span className="text-lg lg:text-xl font-medium">Press to Call</span>
            {/* Sóng âm khi hover */}
            <span className="absolute w-full h-full rounded-full pointer-events-none group-hover:animate-wave-pulse"></span>
          </button>
        </div>
        {/* Services Section */}
        <div className="text-center w-full max-w-5xl">
          <div className="flex flex-row flex-wrap justify-center gap-3 text-left mx-auto">
            {/* Room & Stay */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64 flex flex-col items-center">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Room & Stay</h4>
              <ul className="grid grid-cols-5 gap-3 justify-items-center">
                <li><span className="material-icons text-3xl text-amber-400">login</span></li>
                <li><span className="material-icons text-3xl text-amber-400">hourglass_empty</span></li>
                <li><span className="material-icons text-3xl text-amber-400">info</span></li>
                <li><span className="material-icons text-3xl text-amber-400">policy</span></li>
                <li><span className="material-icons text-3xl text-amber-400">wifi</span></li>
              </ul>
            </div>
            {/* Room Services */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64 flex flex-col items-center">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Room Services</h4>
              <ul className="grid grid-cols-4 gap-3 justify-items-center">
                <li><span className="material-icons text-3xl text-amber-400">restaurant</span></li>
                <li><span className="material-icons text-3xl text-amber-400">local_bar</span></li>
                <li><span className="material-icons text-3xl text-amber-400">cleaning_services</span></li>
                <li><span className="material-icons text-3xl text-amber-400">local_laundry_service</span></li>
                <li><span className="material-icons text-3xl text-amber-400">alarm</span></li>
                <li><span className="material-icons text-3xl text-amber-400">add_circle</span></li>
                <li><span className="material-icons text-3xl text-amber-400">build</span></li>
              </ul>
            </div>
            {/* Bookings & Facilities */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64 flex flex-col items-center">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Bookings & Facilities</h4>
              <ul className="grid grid-cols-4 gap-3 justify-items-center">
                <li><span className="material-icons text-3xl text-amber-400">event_seat</span></li>
                <li><span className="material-icons text-3xl text-amber-400">spa</span></li>
                <li><span className="material-icons text-3xl text-amber-400">fitness_center</span></li>
                <li><span className="material-icons text-3xl text-amber-400">pool</span></li>
                <li><span className="material-icons text-3xl text-amber-400">directions_car</span></li>
                <li><span className="material-icons text-3xl text-amber-400">medical_services</span></li>
                <li><span className="material-icons text-3xl text-amber-400">support_agent</span></li>
              </ul>
            </div>
            {/* Tourism & Exploration */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64 flex flex-col items-center">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Tourism & Exploration</h4>
              <ul className="grid grid-cols-4 gap-3 justify-items-center">
                <li><span className="material-icons text-3xl text-amber-400">place</span></li>
                <li><span className="material-icons text-3xl text-amber-400">local_dining</span></li>
                <li><span className="material-icons text-3xl text-amber-400">directions_bus</span></li>
                <li><span className="material-icons text-3xl text-amber-400">directions_car</span></li>
                <li><span className="material-icons text-3xl text-amber-400">event</span></li>
                <li><span className="material-icons text-3xl text-amber-400">shopping_bag</span></li>
                <li><span className="material-icons text-3xl text-amber-400">map</span></li>
              </ul>
            </div>
            {/* Support */}
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm w-64 flex flex-col items-center">
              <h4 className="font-medium text-amber-400 border-b border-amber-400/30 pb-1 mb-2 text-sm">Support</h4>
              <ul className="grid grid-cols-4 gap-3 justify-items-center">
                <li><span className="material-icons text-3xl text-amber-400">translate</span></li>
                <li><span className="material-icons text-3xl text-amber-400">rate_review</span></li>
                <li><span className="material-icons text-3xl text-amber-400">report_problem</span></li>
                <li><span className="material-icons text-3xl text-amber-400">luggage</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface1;
