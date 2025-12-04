import React from 'react';
import { Target, Zap, AlertTriangle, TrendingUp, Flame, BrainCircuit } from 'lucide-react';
import { MasteryItem } from '../types';

interface BrainDashboardProps {
  masteryData: MasteryItem[];
  streak: number;
  brainEnergy: number;
}

export const BrainDashboard: React.FC<BrainDashboardProps> = ({ masteryData, streak, brainEnergy }) => {
  return (
    <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto">
      
      {/* 1. Mastery Map */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Target size={14} className="text-cyan-400" /> Mastery Map
        </h3>
        
        <div className="relative w-full aspect-square max-h-[240px] flex items-center justify-center">
            {/* Background Rings */}
            <div className="absolute inset-0 border border-slate-700/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-slate-700/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
            <div className="absolute inset-16 border border-slate-800/50 rounded-full"></div>
            
            {/* Central Brain Core */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
               <BrainCircuit size={32} className="text-cyan-400" />
            </div>

            {/* Orbiting Nodes (Simulated) */}
            {masteryData.map((item, idx) => {
                const angle = (idx / masteryData.length) * 2 * Math.PI;
                const radius = 80; // px
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                let colorClass = "bg-slate-500 shadow-slate-500/50";
                if (item.status === 'mastered') colorClass = "bg-emerald-400 shadow-emerald-400/50";
                if (item.status === 'warning') colorClass = "bg-amber-400 shadow-amber-400/50";
                if (item.status === 'danger') colorClass = "bg-rose-500 shadow-rose-500/50";

                return (
                    <div 
                        key={item.id}
                        className={`absolute w-3 h-3 rounded-full shadow-[0_0_10px] ${colorClass} transition-all duration-500`}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                        title={`${item.topic}: ${item.level}%`}
                    ></div>
                );
            })}
        </div>
      </div>

      {/* 2. Weak Spot Radar */}
      <div className="glass-panel p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
         <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Danger Zones
         </h4>
         <div className="space-y-2">
            {masteryData.filter(m => m.status === 'danger').map(m => (
                <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{m.topic}</span>
                    <span className="text-rose-400 font-bold">{m.level}%</span>
                </div>
            ))}
            {masteryData.filter(m => m.status === 'danger').length === 0 && (
                <p className="text-xs text-slate-500 italic">No weak spots detected. You're flying.</p>
            )}
         </div>
      </div>

      {/* 3. Study Streak Forge */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame size={64} className="text-amber-500" />
         </div>
         
         <div className="relative z-10">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Streak Forge</h4>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-display font-bold text-white">{streak}</span>
                <span className="text-sm font-medium text-slate-400 mb-1.5">days</span>
            </div>
            
            <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 w-3/4 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Keep the fire alive. Learning is habit.</p>
         </div>
      </div>
      
      {/* 4. Brain Energy */}
      <div>
         <div className="flex justify-between items-center mb-2">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" /> Cognitive Load
             </h4>
             <span className="text-xs font-bold text-indigo-400">{brainEnergy}%</span>
         </div>
         <div className="flex gap-1 h-2">
             {[...Array(10)].map((_, i) => (
                 <div 
                    key={i} 
                    className={`flex-1 rounded-sm ${
                        (i+1) * 10 <= brainEnergy 
                        ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                        : 'bg-slate-800'
                    }`}
                 ></div>
             ))}
         </div>
      </div>

    </div>
  );
};
