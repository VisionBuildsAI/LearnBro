import React from 'react';
import { CheckCircle2, BookOpen, MessageSquare, BrainCircuit, Trophy, Calendar, PenTool, Layers, X, Activity, TrendingUp } from 'lucide-react';
import { LearningEvent } from '../types';

interface TimelineViewProps {
  events: LearningEvent[];
  onClose: () => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'quiz': return <BrainCircuit size={16} />;
    case 'flashcards': return <Layers size={16} />;
    case 'practice': return <PenTool size={16} />;
    default: return <MessageSquare size={16} />;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'quiz': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'flashcards': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    case 'practice': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    default: return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
  }
};

const getMasteryBadge = (score?: number) => {
  if (score === undefined) return null;
  if (score >= 90) return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-200 dark:border-green-800">Master</span>;
  if (score >= 70) return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px] font-bold uppercase tracking-wider border border-yellow-200 dark:border-yellow-800">Proficient</span>;
  return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">Learning</span>;
};

export const TimelineView: React.FC<TimelineViewProps> = ({ events, onClose }) => {
  // Sort events by date descending
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl h-[80vh] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden dark:text-slate-100 bg-white/90 dark:bg-slate-900/90">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                <Activity size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold font-display tracking-tight">Memory Timeline</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                   <TrendingUp size={12} className="text-green-500"/> Your learning journey
                </p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide relative">
           
           {/* Decorative Line */}
           <div className="absolute left-8 md:left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent opacity-20 z-0"></div>

           <div className="space-y-8 relative z-10">
              {sortedEvents.map((event, index) => (
                 <div 
                   key={event.id} 
                   className="flex gap-4 md:gap-6 animate-slide-up"
                   style={{ animationDelay: `${index * 0.1}s` }}
                 >
                    {/* Timeline Node */}
                    <div className="flex flex-col items-center">
                       <div className={`
                         w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-md z-10 flex-shrink-0 mt-6
                         ${event.score && event.score >= 90 ? 'bg-green-500' : 'bg-indigo-500'}
                       `}></div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 glass-panel p-5 rounded-2xl hover:scale-[1.01] transition-transform duration-300 border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-md group">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                             <Calendar size={10} />
                             {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {getMasteryBadge(event.score)}
                       </div>
                       
                       <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {event.topic}
                       </h3>
                       
                       <div className="flex items-center gap-3 mt-3">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getColorForType(event.type)}`}>
                             {getIconForType(event.type)}
                             <span className="capitalize">{event.type}</span>
                          </div>
                          
                          {event.score !== undefined && (
                             <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <Trophy size={12} className={event.score >= 90 ? "text-yellow-500" : "text-slate-400"} />
                                Score: {event.score}%
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              ))}

              {sortedEvents.length === 0 && (
                  <div className="text-center py-12 opacity-50">
                      <p>No learning history yet. Start chatting!</p>
                  </div>
              )}
           </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50 flex justify-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
               Keep your streak alive! 🔥
            </p>
        </div>
      </div>
    </div>
  );
};