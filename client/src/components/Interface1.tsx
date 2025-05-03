import React, { useState, useEffect } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import hotelImage from '../assets/hotel-exterior.jpeg';
import minhonLogo from '../public/assets/references/images/minhon-logo.png';
import { FaRegClock, FaCheckCircle, FaHourglassHalf, FaHotel } from 'react-icons/fa';

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
      <div className="container mx-auto h-full flex flex-col items-center justify-start text-dark p-5 pt-10 lg:pt-16 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="flex items-center gap-2">
            <img src={minhonLogo} alt="Mi Nhon Hotel Logo" className="w-40 h-auto mb-1 drop-shadow-lg" />
            <FaHotel className="text-accent text-2xl mb-1" title="Boutique Hotel" />
          </div>
          <h2 className="font-poppins font-bold text-2xl lg:text-3xl text-primary mb-1 text-center tracking-wide">Mi Nhon Hotel Mui Ne</h2>
          {/* Optional: Add a small boutique icon or hotel thumbnail here if available */}
        </div>
        {/* Active orders status panels (up to 60 min countdown) */}
        <div className="flex flex-col items-center w-full mb-6">
          {activeOrders.map((o) => {
            const deadline = new Date(o.requestedAt.getTime() + 60 * 60 * 1000);
            const diffSec = Math.max(Math.ceil((deadline.getTime() - now.getTime()) / 1000), 0);
            if (diffSec <= 0) return null;
            const mins = Math.floor(diffSec / 60).toString().padStart(2, '0');
            const secs = (diffSec % 60).toString().padStart(2, '0');
            // Status color: green (processing), yellow (pending)
            const statusColor = o.status === 'processing' ? 'bg-green-100 text-green-700 border-green-400' : 'bg-yellow-100 text-yellow-700 border-yellow-400';
            const statusIcon = o.status === 'processing' ? <FaCheckCircle className="inline mr-1 text-green-500" /> : <FaHourglassHalf className="inline mr-1 text-yellow-500" />;
            return (
              <div key={o.reference} className={`border border-primary/30 bg-card/90 shadow-md rounded-lg px-5 py-3 mb-3 max-w-md w-full flex flex-col gap-1`}> 
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-primary">Order Ref:</span> <span>{o.reference}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1 ${statusColor}`}>{statusIcon}{o.status === 'processing' ? 'Processing' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">Requested At:</span> <span>{o.requestedAt.toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">Estimated Completion:</span> <span>{o.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaRegClock className="text-accent" />
                  <span className="text-primary">Time Remaining:</span> <span className="font-mono">{`${mins}:${secs}`}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Voice Assistant Button */}
        <div className="relative mb-10 flex flex-col items-center">
          {/* Gold Sparkling Light Effect */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
            <svg width="100%" height="100%" viewBox="0 0 180 180" className="animate-spin-slow" style={{position:'absolute',top:0,left:0}}>
              <defs>
                <radialGradient id="sparkleGold" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fffbe6" stopOpacity="0.8" />
                  <stop offset="80%" stopColor="#ffe066" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ffe066" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Rotating gold highlight arc */}
              <path d="M90 20 A70 70 0 1 1 89.9 20" stroke="url(#sparkleGold)" strokeWidth="8" fill="none" strokeLinecap="round"/>
              {/* Sparkles */}
              <circle cx="40" cy="30" r="2.5" fill="#ffe066" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="140" cy="50" r="2" fill="#fffbe6" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.1;0.7" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="120" cy="140" r="2.8" fill="#ffe066" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="60" cy="150" r="2" fill="#fffbe6" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          {/* Animated Glow */}
          <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse bg-accent/20 blur-xl" style={{filter:'blur(16px)'}}></div>
          {/* Ripple Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-accent animate-[ripple_1.5s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full border-4 border-accent/70 animate-[ripple_2s_linear_infinite]"></div>
          {/* Main Button */}
          <button 
            id="vapiButton" 
            className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-gradient-to-r from-accent to-primary text-dark font-poppins font-bold flex flex-col items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent/40 border-4 border-white"
            onClick={startCall}
            style={{boxShadow:'0 0 0 8px #d4af3722'}}
          >
            <span className="material-icons text-4xl lg:text-5xl mb-1">mic</span>
            <span className="text-sm lg:text-base font-medium">Press to Call</span>
          </button>
        </div>
        {/* Services Section */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left mx-auto mt-2">
          {/* Room & Stay */}
          <div className="bg-primary/5 p-4 rounded-lg shadow-sm border border-primary/10 transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
            <h4 className="font-semibold text-primary border-b border-primary/20 pb-1 mb-2 text-base flex items-center gap-2"><span className="material-icons text-primary">hotel</span>Room & Stay</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="material-icons text-primary">login</span>Check-in/check-out</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">event_available</span>Room extension</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">info</span>Room information</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">policy</span>Hotel policies</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">wifi</span>Wi-Fi & FAQ</li>
            </ul>
          </div>
          {/* Room Services */}
          <div className="bg-accent/10 p-4 rounded-lg shadow-sm border border-accent/20 transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
            <h4 className="font-semibold text-accent border-b border-accent/20 pb-1 mb-2 text-base flex items-center gap-2"><span className="material-icons text-accent">room_service</span>Room Services</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="material-icons text-accent">restaurant</span>Food & beverages</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">local_bar</span>Mini bar service</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">cleaning_services</span>Housekeeping</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">local_laundry_service</span>Laundry</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">alarm</span>Wake-up service</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">add_circle</span>Additional amenities</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">build</span>Technical assistance</li>
            </ul>
          </div>
          {/* Bookings & Facilities */}
          <div className="bg-primary/10 p-4 rounded-lg shadow-sm border border-primary/10 transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
            <h4 className="font-semibold text-primary border-b border-primary/20 pb-1 mb-2 text-base flex items-center gap-2"><span className="material-icons text-primary">event</span>Bookings & Facilities</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="material-icons text-primary">restaurant_menu</span>Restaurant reservations</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">spa</span>Spa/massage appointments</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">fitness_center</span>Gym facilities</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">pool</span>Swimming pool</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">directions_bus</span>Transportation</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">medical_services</span>Medical assistance</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">accessible</span>Special assistance</li>
            </ul>
          </div>
          {/* Tourism & Exploration */}
          <div className="bg-accent/5 p-4 rounded-lg shadow-sm border border-accent/10 transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
            <h4 className="font-semibold text-accent border-b border-accent/20 pb-1 mb-2 text-base flex items-center gap-2"><span className="material-icons text-accent">explore</span>Tourism & Exploration</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="material-icons text-accent">place</span>Nearby attractions</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">restaurant</span>Local restaurants</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">train</span>Public transportation</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">directions_car</span>Car rental</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">event</span>Weather & Events</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">shopping_bag</span>Shopping</li>
              <li className="flex items-center gap-2"><span className="material-icons text-accent">tour</span>Tours</li>
            </ul>
          </div>
          {/* Support */}
          <div className="bg-primary/5 p-4 rounded-lg shadow-sm border border-primary/10 transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer">
            <h4 className="font-semibold text-primary border-b border-primary/20 pb-1 mb-2 text-base flex items-center gap-2"><span className="material-icons text-primary">support_agent</span>Support</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><span className="material-icons text-primary">translate</span>Language assistance</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">rate_review</span>Feedback & Reviews</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">emergency</span>Emergency support</li>
              <li className="flex items-center gap-2"><span className="material-icons text-primary">luggage</span>Luggage service</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interface1;
