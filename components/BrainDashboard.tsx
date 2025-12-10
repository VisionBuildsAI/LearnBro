import React from 'react';
import { Zap, Activity, Flame, BrainCircuit, Radar, BarChart3 } from 'lucide-react';
import { MasteryItem } from '../types';

interface BrainDashboardProps {
  masteryData: MasteryItem[];
  streak: number;
  brainEnergy: number;
}

export const BrainDashboard: React.FC<BrainDashboardProps> = ({ masteryData, streak, brainEnergy }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Holographic Mastery Radar */}
      <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Radar size={14} className="animate-spin-slow" /> Cortex Scan
            </h3>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-[10px] text-cyan-400 font-mono shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                LIVE
            </span>
        </div>
        
        <div className="relative w-full aspect-square max-h-[220px] flex items-center justify-center mx-auto my-2">
            {/* HUD Rings */}
            <div className="absolute inset-0 border border-cyan-900/30 rounded-full"></div>
            <div className="absolute inset-[15%] border border-cyan-500/10 rounded-full border-dashed animate-[spin_60s_linear_infinite]"></div>
            <div className="absolute inset-[35%] border border-cyan-400/20 rounded-full"></div>
            <div className="absolute inset-[55%] border border-cyan-900/40 rounded-full"></div>
            
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-900/20"></div>
            <div className="absolute h-full w-[1px] bg-cyan-900/20"></div>

            {/* Central Core */}
            <div className="relative z-10 w-10 h-10 rounded-full bg-black/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-pulse-glow backdrop-blur-sm">
               <BrainCircuit size={18} className="text-cyan-400" />
            </div>

            {/* Data Nodes */}
            {masteryData.map((item, idx) => {
                const angle = (idx / masteryData.length) * 2 * Math.PI - (Math.PI / 2);
                const maxRadius = 90; // Approximate pixel radius
                const radius = maxRadius * (item.level / 100); 
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                let colorClass = "bg-slate-500 box-shadow-none";
                if (item.status === 'mastered') colorClass = "bg-emerald-400 shadow-[0_0_10px_#34d399]";
                if (item.status === 'warning') colorClass = "bg-amber-400 shadow-[0_0_10px_#fbbf24]";
                if (item.status === 'danger') colorClass = "bg-rose-500 shadow-[0_0_10px_#f43f5e]";

                return (
                    <div 
                        key={item.id}
                        className="absolute flex items-center justify-center"
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                        {/* Node Point */}
                        <div className={`w-2.5 h-2.5 rounded-full ${colorClass} transition-all duration-1000 ease-out z-20 border border-black`}></div>
                        
                        {/* Connecting Line to Center */}
                        <div 
                             className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-transparent to-cyan-500/30 origin-left -z-10"
                             style={{ 
                                 width: `${radius}px`, 
                                 transform: `rotate(${angle + Math.PI}rad) translateY(-50%)`,
                             }}
                        ></div>
                    </div>
                );
            })}
        </div>
        
        {/* Scanned Stats Table */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6">
             {masteryData.slice(0, 4).map(m => (
                 <div key={m.id} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 group/item">
                     <span className="text-slate-400 group-hover/item:text-cyan-300 transition-colors truncate">{m.topic}</span>
                     <span className={`font-mono font-bold ${
                         m.status === 'mastered' ? 'text-emerald-400' : 
                         m.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                     }`}>{m.level}%</span>
                 </div>
             ))}
        </div>
      </div>

      {/* 2. Streak Reactor */}
      <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group border-amber-500/20 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)]">
         <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
         <div className="absolute top-0 right-0 p-4 opacity-30 animate-pulse">
            <Flame size={56} className="text-amber-500 blur-sm" />
         </div>
         
         <div className="relative z-10">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Activity size={12} /> Streak Reactor
            </h4>
            <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                    {streak}
                </span>
                <span className="text-xs font-bold text-amber-500/80 mb-1">DAYS ACTIVE</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div 
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.8)] relative"
                    style={{ width: '75%' }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
         </div>
      </div>
      
      {/* 3. Cognitive Load */}
      <div className="glass-panel p-5 rounded-3xl border-indigo-500/20">
         <div className="flex justify-between items-center mb-4">
             <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} /> Neural Load
             </h4>
             <div className="flex items-center gap-1">
                 <span className="text-xs font-mono font-bold text-indigo-300">{brainEnergy}%</span>
                 <BarChart3 size={12} className="text-indigo-500" />
             </div>
         </div>
         <div className="flex gap-1.5 h-10 items-end">
             {[...Array(10)].map((_, i) => {
                 const active = (i+1) * 10 <= brainEnergy;
                 const height = 30 + Math.random() * 70; // Randomize height for audio-visualizer look
                 return (
                     <div 
                        key={i} 
                        className={`flex-1 rounded-sm transition-all duration-500 ${
                            active 
                            ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                            : 'bg-slate-800/40'
                        }`}
                        style={{ height: active ? `${height}%` : '15%' }}
                     ></div>
                 );
             })}
         </div>
      </div>

    </div>
  );
};