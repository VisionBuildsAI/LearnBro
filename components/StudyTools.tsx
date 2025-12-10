import React, { useState } from 'react';
import { Check, X, RotateCw, ChevronRight, ChevronLeft, BrainCircuit, AlertCircle, HelpCircle, Eye, EyeOff, Trophy, Sparkles, FileText, Bookmark, Lightbulb, CheckCircle2, Shuffle, Plus, Trash2, Printer, Clock, FileQuestion, Layers, Zap } from 'lucide-react';

// --- Types ---
interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface Flashcard {
  front: string;
  back: string;
}

interface PracticeProblem {
    problem: string;
    hint: string;
    solution: string;
}

interface CheatSheetSection {
    title: string;
    items: string[];
}

interface CheatSheetData {
    title: string;
    summary: string;
    sections: CheatSheetSection[];
}

interface QuestionPaperData {
  title: string;
  totalMarks: number;
  durationMinutes: number;
  instructions: string[];
  sections: {
    name: string;
    questions: {
      id: number;
      text: string;
      marks: number;
    }[];
  }[];
}

// --- Reusable Cyber Card ---
const CyberCard: React.FC<{ children: React.ReactNode, className?: string, glowColor?: string }> = ({ children, className = "", glowColor = "indigo" }) => (
    <div className={`glass-panel rounded-2xl border border-white/5 relative overflow-hidden group transition-all duration-300 ${className}`}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${glowColor}-500 to-transparent opacity-50`}></div>
        <div className={`absolute -inset-0.5 bg-${glowColor}-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}></div>
        {children}
    </div>
);

// --- Quiz Component ---
export const QuizView: React.FC<{ data: QuizQuestion[] }> = ({ data }) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const handleSelect = (qIndex: number, option: string) => {
    if (score !== null) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    data.forEach((q, idx) => { if (userAnswers[idx] === q.answer) newScore++; });
    setScore(newScore);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <BrainCircuit size={20} />
             </div>
             <div>
                <h3 className="font-bold text-lg text-white font-display">Knowledge Check</h3>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Module: Active Recall</p>
             </div>
        </div>
        {score !== null && (
             <div className="px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold font-mono text-sm">
                 SCORE: {Math.round((score/data.length)*100)}%
             </div>
        )}
      </div>

      {data.map((q, idx) => {
        const isSubmitted = score !== null;
        return (
          <CyberCard key={idx} className="p-6" glowColor="emerald">
            <div className="flex items-start gap-4 mb-6">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center text-sm font-bold font-mono">0{idx + 1}</span>
                <p className="font-medium text-slate-200 text-lg leading-relaxed">{q.question}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-12">
              {q.options.map((option) => {
                let btnClass = "w-full text-left p-4 rounded-xl border transition-all text-sm font-medium flex justify-between items-center group relative overflow-hidden ";
                
                if (isSubmitted) {
                   if (option === q.answer) btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                   else if (userAnswers[idx] === option) btnClass += "bg-rose-500/20 border-rose-500 text-rose-300";
                   else btnClass += "bg-white/5 border-white/5 text-slate-500 opacity-50";
                } else {
                   if (userAnswers[idx] === option) btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                   else btnClass += "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-emerald-500/50 hover:text-white";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(idx, option)}
                    className={btnClass}
                    disabled={isSubmitted}
                  >
                    <span className="relative z-10">{option}</span>
                    {isSubmitted && option === q.answer && <Check size={16} className="text-emerald-400" />}
                    {isSubmitted && userAnswers[idx] === option && option !== q.answer && <X size={16} className="text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </CyberCard>
        );
      })}

      {!score && score !== 0 && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(userAnswers).length < data.length}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-display tracking-wide uppercase shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(5,150,105,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Finalize Answers
        </button>
      )}
    </div>
  );
};

// --- Flashcard Component ---
export const FlashcardView: React.FC<{ data: Flashcard[] }> = ({ data }) => {
  const [deck, setDeck] = useState<Flashcard[]>(data);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  if (!deck || deck.length === 0) return (
     <div className="p-8 glass-panel rounded-2xl text-center border-dashed border-2 border-white/20">
         <div className="mb-4 inline-flex p-4 rounded-full bg-white/5"><RotateCw size={24} className="text-slate-400"/></div>
         <h3 className="text-slate-300 font-bold mb-2">Deck Empty</h3>
         <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold">Add Card</button>
         {isAdding && (
            <div className="mt-4 space-y-2">
                <input className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm" placeholder="Front" value={newFront} onChange={e => setNewFront(e.target.value)} />
                <input className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm" placeholder="Back" value={newBack} onChange={e => setNewBack(e.target.value)} />
                <button onClick={() => {if(newFront && newBack) { setDeck([{front:newFront, back:newBack}]); setIsAdding(false); }}} className="w-full bg-indigo-500 p-2 rounded text-xs font-bold">Save</button>
            </div>
         )}
     </div>
  );

  const handleNext = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev + 1) % deck.length), 300); };
  const handlePrev = () => { setIsFlipped(false); setTimeout(() => setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length), 300); };
  
  return (
    <div className="w-full max-w-lg mx-auto py-4">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-mono text-indigo-400 font-bold tracking-widest">FLASH DECK v2.0</span>
        </div>
        <div className="flex gap-2">
             <button onClick={() => { const s = [...deck].sort(() => Math.random()-0.5); setDeck(s); setCurrentIndex(0); setIsFlipped(false); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-indigo-400"><Shuffle size={14}/></button>
             <button onClick={() => setIsAdding(!isAdding)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-indigo-400"><Plus size={14}/></button>
        </div>
      </div>
      
      {/* Progress Line */}
      <div className="w-full h-1 bg-white/10 rounded-full mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_10px_#6366f1] transition-all duration-300" style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}></div>
      </div>

      {/* Add Modal */}
      {isAdding && (
         <div className="mb-6 p-4 glass-panel rounded-xl animate-slide-up border border-indigo-500/30">
             <input className="w-full mb-2 p-3 bg-black/40 border border-white/10 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="Question..." value={newFront} onChange={e => setNewFront(e.target.value)} />
             <textarea className="w-full mb-3 p-3 bg-black/40 border border-white/10 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none" rows={2} placeholder="Answer..." value={newBack} onChange={e => setNewBack(e.target.value)} />
             <div className="flex gap-2">
                 <button onClick={() => {if(newFront && newBack){setDeck([...deck, {front:newFront, back:newBack}]); setNewFront(""); setNewBack(""); setIsAdding(false);}}} className="flex-1 bg-indigo-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-500">ADD DATA</button>
                 <button onClick={() => setIsAdding(false)} className="px-4 bg-white/5 border border-white/10 rounded-lg text-xs font-bold">CANCEL</button>
             </div>
         </div>
      )}

      {/* 3D Card Container */}
      <div className="relative h-80 w-full perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)]">
            <div className="absolute top-4 left-4 text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded">QUERY</div>
            <h4 className="text-2xl md:text-3xl font-bold text-white leading-tight font-display">{deck[currentIndex].front}</h4>
            <div className="absolute bottom-6 text-xs text-indigo-300/50 flex items-center gap-2 animate-pulse">
                <RotateCw size={12}/> FLIP TO REVEAL
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)]">
            <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-500 border border-slate-300 px-2 py-0.5 rounded">DATA</div>
            <p className="text-lg font-medium text-slate-900 leading-relaxed">{deck[currentIndex].back}</p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-8 px-4">
        <button onClick={(e) => {e.stopPropagation(); handlePrev();}} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500 hover:text-white transition-all"><ChevronLeft size={20}/></button>
        <div className="text-center font-mono text-xs text-slate-500">
             CARD <span className="text-white font-bold">{currentIndex + 1}</span> / {deck.length}
        </div>
        <button onClick={(e) => {e.stopPropagation(); handleNext();}} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500 hover:text-white transition-all"><ChevronRight size={20}/></button>
      </div>
    </div>
  );
};

// --- Practice Problems Component ---
export const PracticeProblemsView: React.FC<{ data: PracticeProblem[] }> = ({ data }) => {
    const [visibleHints, setVisibleHints] = useState<Record<number, boolean>>({});
    const [visibleSolutions, setVisibleSolutions] = useState<Record<number, boolean>>({});

    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Zap size={20}/></div>
                <h3 className="text-lg font-bold text-white font-display">Combat Drills</h3>
            </div>
            {data.map((item, idx) => (
                <CyberCard key={idx} className="p-6" glowColor="amber">
                    <div className="flex gap-4">
                        <span className="text-xl font-bold text-amber-500 font-mono">0{idx+1}</span>
                        <p className="text-lg text-slate-200 font-medium leading-relaxed">{item.problem}</p>
                    </div>
                    <div className="mt-6 pl-10 flex gap-3">
                        <button onClick={() => setVisibleHints(p => ({...p, [idx]: !p[idx]}))} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/50 hover:text-amber-400 text-xs font-bold transition-all flex items-center gap-2">
                            <Lightbulb size={14}/> {visibleHints[idx] ? 'HIDE INTEL' : 'REVEAL HINT'}
                        </button>
                        <button onClick={() => setVisibleSolutions(p => ({...p, [idx]: !p[idx]}))} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 text-xs font-bold transition-all flex items-center gap-2">
                            {visibleSolutions[idx] ? <EyeOff size={14}/> : <Eye size={14}/>} {visibleSolutions[idx] ? 'HIDE ANSWER' : 'SHOW SOLUTION'}
                        </button>
                    </div>
                    {visibleHints[idx] && (
                        <div className="mt-4 ml-10 p-4 bg-amber-500/10 border-l-2 border-amber-500 rounded-r-lg animate-slide-up text-sm text-amber-200">
                            <span className="font-bold text-amber-400 block mb-1">INTEL:</span> {item.hint}
                        </div>
                    )}
                    {visibleSolutions[idx] && (
                        <div className="mt-4 ml-10 p-4 bg-emerald-500/10 border-l-2 border-emerald-500 rounded-r-lg animate-slide-up text-sm text-emerald-200">
                             <span className="font-bold text-emerald-400 block mb-1">SOLUTION:</span> {item.solution}
                        </div>
                    )}
                </CyberCard>
            ))}
        </div>
    );
};

// --- Cheat Sheet Component ---
export const CheatSheetView: React.FC<{ data: CheatSheetData }> = ({ data }) => {
    if (!data || !data.sections) return null;
    return (
        <div className="glass-panel p-8 rounded-2xl border border-purple-500/20 shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)]">
            <div className="border-b border-white/10 pb-6 mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white font-display mb-2">{data.title}</h2>
                    <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-mono font-bold inline-block">NEURAL DOWNLOAD</div>
                </div>
                <FileText size={32} className="text-purple-500 opacity-50"/>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300 italic mb-8">
                "{data.summary}"
            </div>
            <div className="grid gap-6">
                {data.sections.map((section, idx) => (
                    <div key={idx} className="relative pl-6 border-l border-purple-500/30">
                        <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>
                        <h3 className="text-lg font-bold text-purple-400 mb-3">{section.title}</h3>
                        <ul className="space-y-2">
                            {section.items.map((item, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="text-purple-500 mt-1">›</span> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Question Paper Component ---
export const QuestionPaperView: React.FC<{ data: QuestionPaperData }> = ({ data }) => {
    if (!data || !data.sections) return null;
    return (
        <div className="bg-white text-black p-8 rounded-sm shadow-2xl font-serif max-w-3xl mx-auto relative overflow-hidden">
             {/* Paper Texture Overlay for "Realism" */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none"></div>
             
             <div className="relative z-10">
                 <div className="text-center border-b-2 border-black pb-6 mb-8">
                     <h1 className="text-3xl font-bold uppercase tracking-widest">{data.title}</h1>
                     <div className="flex justify-between mt-4 font-bold text-sm">
                         <span>TIME: {data.durationMinutes} MINS</span>
                         <span>MAX MARKS: {data.totalMarks}</span>
                     </div>
                 </div>

                 {data.instructions?.length > 0 && (
                     <div className="mb-8 p-4 border border-black/10 bg-black/5 text-sm">
                         <p className="font-bold uppercase mb-2">Instructions:</p>
                         <ul className="list-disc ml-4 space-y-1">{data.instructions.map((inst,i)=><li key={i}>{inst}</li>)}</ul>
                     </div>
                 )}

                 <div className="space-y-8">
                     {data.sections.map((sec, idx) => (
                         <div key={idx}>
                             <h3 className="text-center font-bold uppercase tracking-widest text-sm mb-4 border-y border-black py-1">{sec.name}</h3>
                             <div className="space-y-4">
                                 {sec.questions.map(q => (
                                     <div key={q.id} className="flex gap-4">
                                         <span className="font-bold">{q.id}.</span>
                                         <p className="flex-1">{q.text}</p>
                                         <span className="font-bold text-sm">[{q.marks}]</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 <div className="mt-12 text-center border-t border-black pt-4 text-xs font-bold uppercase tracking-widest">
                     *** END OF EXAMINATION ***
                 </div>
             </div>
             
             {/* Print Action (Hidden on print) */}
             <button onClick={() => window.print()} className="absolute top-4 right-4 print:hidden p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"><Printer size={20}/></button>
        </div>
    );
};