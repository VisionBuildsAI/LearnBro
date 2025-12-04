import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, Headphones, Activity } from 'lucide-react';
import { LiveAudioService } from '../services/liveAudioService';

interface LiveVoiceModalProps {
  onClose: () => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ onClose }) => {
  const [status, setStatus] = useState("Initializing...");
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const serviceRef = useRef<LiveAudioService | null>(null);

  useEffect(() => {
    // Start Service
    const service = new LiveAudioService();
    serviceRef.current = service;

    service.onStatusChange = (s) => setStatus(s);
    service.onVolumeUpdate = (v) => setVolume(v);
    service.onClose = () => {
        // Optional cleanup if closed from service side
    };

    service.start();

    return () => {
      service.stop();
    };
  }, []);

  const handleClose = () => {
    serviceRef.current?.stop();
    onClose();
  };

  // Dynamic visual scaling based on volume
  const scale = 1 + Math.min(volume * 5, 1.5); // Cap scaling
  const glowOpacity = 0.4 + Math.min(volume * 2, 0.6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-fade-in">
      <div className="flex flex-col items-center justify-between w-full h-full max-h-[800px] relative">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center p-6">
            <div className="flex items-center gap-2 text-white/80">
                <Headphones size={20} className="animate-pulse" />
                <span className="font-display font-bold tracking-wide">LearnBro Live</span>
            </div>
            <button 
                onClick={handleClose}
                className="p-3 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-all border border-white/10"
            >
                <X size={24} />
            </button>
        </div>

        {/* Central Visual */}
        <div className="flex-1 flex flex-col items-center justify-center w-full relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* The "Orb" */}
            <div 
                className="relative w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{ transform: `scale(${scale})` }}
            >
                {/* Core */}
                <div className="absolute inset-4 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 rounded-full shadow-lg shadow-indigo-500/50 animate-pulse-glow"></div>
                
                {/* Ripples */}
                <div className="absolute inset-0 border border-white/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute -inset-4 border border-white/20 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
                
                {/* Icon */}
                <div className="relative z-10 text-white drop-shadow-md">
                     <Activity size={48} strokeWidth={1.5} />
                </div>
            </div>

            {/* Status Text */}
            <div className="mt-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">{status === "Connected" ? "Listening..." : status}</h2>
                <p className="text-white/50 text-sm">Speak naturally. Interrupt anytime.</p>
            </div>
        </div>

        {/* Controls */}
        <div className="mb-12 flex gap-6">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-6 rounded-full transition-all duration-300 border backdrop-blur-md ${isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
            >
                {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
        </div>

      </div>
    </div>
  );
};