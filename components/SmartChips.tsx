import React from 'react';
import { Sparkles, Zap, ShieldAlert, BookOpen, FileText, ListChecks } from 'lucide-react';

interface SmartChipsProps {
  onSelect: (prompt: string) => void;
}

const CHIPS = [
  { label: "Scan Homework", prompt: "Can you help me solve this homework problem? I'll upload an image.", icon: <Sparkles size={14} className="text-cyan-400" />, border: "hover:border-cyan-500/50", bg: "hover:bg-cyan-500/10", shadow: "hover:shadow-cyan-500/20" },
  { label: "Create 20Q Quiz", prompt: "Create a 20 question multiple choice quiz on this topic.", icon: <ListChecks size={14} className="text-emerald-400" />, border: "hover:border-emerald-500/50", bg: "hover:bg-emerald-500/10", shadow: "hover:shadow-emerald-500/20" },
  { label: "Create Cheat Sheet", prompt: "Generate a high-yield cheat sheet for this topic. Include summaries and formulas.", icon: <FileText size={14} className="text-purple-400" />, border: "hover:border-purple-500/50", bg: "hover:bg-purple-500/10", shadow: "hover:shadow-purple-500/20" },
  { label: "Rescue Plan (20m)", prompt: "I have 20 minutes. Create a high-impact rescue study plan for me right now.", icon: <Zap size={14} className="text-amber-400" />, border: "hover:border-amber-500/50", bg: "hover:bg-amber-500/10", shadow: "hover:shadow-amber-500/20" },
  { label: "Explain Like I'm 5", prompt: "Explain this concept to me like I am 5 years old. Use simple words.", icon: <BookOpen size={14} className="text-emerald-400" />, border: "hover:border-emerald-500/50", bg: "hover:bg-emerald-500/10", shadow: "hover:shadow-emerald-500/20" },
  { label: "Test Me Brutally", prompt: "Grill me on this topic. Be harsh. Find my weak spots.", icon: <ShieldAlert size={14} className="text-rose-400" />, border: "hover:border-rose-500/50", bg: "hover:bg-rose-500/10", shadow: "hover:shadow-rose-500/20" },
];

export const SmartChips: React.FC<SmartChipsProps> = ({ onSelect }) => {
  return (
    <div 
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 10px, black 95%, transparent)' }}
    >
      {CHIPS.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip.prompt)}
          className={`
            flex-shrink-0 flex items-center gap-2 px-4 py-2.5 
            glass-panel rounded-full text-xs font-bold text-slate-300 
            transition-all duration-300 border border-white/5
            ${chip.border} ${chip.bg} hover:text-white hover:-translate-y-0.5 hover:shadow-lg ${chip.shadow}
            group whitespace-nowrap
          `}
        >
          <div className="group-hover:scale-110 transition-transform duration-300">
            {chip.icon}
          </div>
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  );
};