import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from '@/context/AssistantContext';
import Interface1 from './Interface1';
import Interface2 from './Interface2';
import Interface3 from './Interface3';
import Interface3Vi from './Interface3Vi';
import Interface4 from './Interface4';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Link } from 'wouter';
import { History } from 'lucide-react';

const VoiceAssistant: React.FC = () => {
  const { currentInterface } = useAssistant();
  
  // Initialize WebSocket connection
  useWebSocket();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const prevInterface = useRef(currentInterface);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  // Detect direction for slide animation
  useEffect(() => {
    if (
      (prevInterface.current === 'interface1' && currentInterface === 'interface2') ||
      (prevInterface.current === 'interface2' && currentInterface === 'interface3') ||
      (prevInterface.current === 'interface3' && currentInterface === 'interface3vi') ||
      (prevInterface.current === 'interface3vi' && currentInterface === 'interface4')
    ) {
      setTransitionDirection('forward');
    } else {
      setTransitionDirection('backward');
    }
    prevInterface.current = currentInterface;
  }, [currentInterface]);

  // Reduce motion for accessibility
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative h-screen overflow-hidden font-sans text-gray-800 bg-neutral-50" id="app">
      {/* Header Bar */}
      <header className="w-full bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="material-icons mr-2">hotel</span>
            <h1 className="font-poppins font-bold text-xl">Mi Nhon Hotel Mui Ne</h1>
          </div>
          {/* Hamburger menu for mobile */}
          <button className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
            <span className="material-icons text-3xl">menu</span>
          </button>
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/call-history">
              <a className="px-3 py-1 rounded bg-primary-dark text-white text-sm flex items-center">
                <History className="w-4 h-4 mr-1" />
                Call History
              </a>
            </Link>
            <button className="px-3 py-1 rounded bg-amber-400 text-neutral-dark text-sm">
              <span className="material-icons text-sm align-middle mr-1">help_outline</span>
              Help
            </button>
          </div>
        </div>
        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white text-dark w-64 h-full shadow-lg p-6" onClick={e => e.stopPropagation()}>
              <button className="mb-4 flex items-center min-w-[44px] min-h-[44px]" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <span className="material-icons text-2xl mr-2">close</span> Đóng
              </button>
              <Link href="/call-history"><a className="block py-2 text-lg">Lịch sử cuộc gọi</a></Link>
              <button className="block py-2 text-lg w-full text-left">Trợ giúp</button>
            </div>
          </div>
        )}
      </header>

      {/* Interface Layers Container */}
      <div className="relative w-full h-full" id="interfaceContainer">
        <div className={`absolute w-full h-full transition-transform duration-300 z-10 ${currentInterface === 'interface1' ? (transitionDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left') : 'hidden'}`}
          style={prefersReducedMotion ? { transition: 'none' } : {}}>
          <Interface1 isActive={currentInterface === 'interface1'} />
        </div>
        <div className={`absolute w-full h-full transition-transform duration-300 z-20 ${currentInterface === 'interface2' ? (transitionDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left') : 'hidden'}`}
          style={prefersReducedMotion ? { transition: 'none' } : {}}>
          <Interface2 isActive={currentInterface === 'interface2'} />
        </div>
        <div className={`absolute w-full h-full transition-transform duration-300 z-30 ${currentInterface === 'interface3' ? (transitionDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left') : 'hidden'}`}
          style={prefersReducedMotion ? { transition: 'none' } : {}}>
          <Interface3 isActive={currentInterface === 'interface3'} />
        </div>
        <div className={`absolute w-full h-full transition-transform duration-300 z-40 ${currentInterface === 'interface3vi' ? (transitionDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left') : 'hidden'}`}
          style={prefersReducedMotion ? { transition: 'none' } : {}}>
          <Interface3Vi isActive={currentInterface === 'interface3vi'} />
        </div>
        <div className={`absolute w-full h-full transition-transform duration-300 z-50 ${currentInterface === 'interface4' ? (transitionDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left') : 'hidden'}`}
          style={prefersReducedMotion ? { transition: 'none' } : {}}>
          <Interface4 isActive={currentInterface === 'interface4'} />
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
