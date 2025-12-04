import React from 'react';
import { Sparkles, Zap, ShieldAlert, BookOpen, FileText } from 'lucide-react';

interface SmartChipsProps {
  onSelect: (prompt: string) => void;
}

const CHIPS = [
  { label: "Scan Homework", prompt: "Can you help me solve this homework problem? I'll upload an image.", icon: <Sparkles size={12} className="text-cyan-400" /> },
  { label: "Create Cheat Sheet", prompt: "Generate a high-yield cheat sheet for this topic. Include summaries and formulas.", icon: <FileText size={12} className="text-purple-400" /> },
  { label: "Rescue Plan (20m)", prompt: "I have 20 minutes. Create a high-impact rescue study plan for me right now.", icon: <Zap size={12} className="text-amber-400" /> },
  { label: "Explain Like I'm 5", prompt: "Explain this concept to me like I am 5 years old. Use simple words.", icon: <BookOpen size={12} className="text-emerald-400" /> },
  { label: "Test Me Brutally", prompt: "Grill me on this topic. Be harsh. Find my weak spots.", icon: <ShieldAlert size={12} className="text-rose-400" /> },
];

export const SmartChips: React.FC<SmartChipsProps> = ({ onSelect }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mask-fade-sides px-4 md:px-0">
      {CHIPS.map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip.prompt)}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-md border border-slate-700/50 hover:border-slate-600 rounded-full text-xs font-bold text-slate-300 transition-all hover:scale-105 active:scale-95 group shadow-lg"
        >
          {chip.icon}
          <span className="group-hover:text-white transition-colors">{chip.label}</span>
        </button>
      ))}
    </div>
  );
};