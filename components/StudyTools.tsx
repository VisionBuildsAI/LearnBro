import React, { useState } from 'react';
import { Check, X, RotateCw, ChevronRight, ChevronLeft, BrainCircuit, AlertCircle, HelpCircle, Eye, EyeOff, Trophy, Sparkles, FileText, Bookmark, Lightbulb, CheckCircle2, Shuffle, Plus, Trash2 } from 'lucide-react';

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

// --- Quiz Component ---
export const QuizView: React.FC<{ data: QuizQuestion[] }> = ({ data }) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 flex items-center gap-2">
            <AlertCircle size={20} />
            <p>Could not load quiz data.</p>
        </div>
    );
  }

  const handleSelect = (qIndex: number, option: string) => {
    if (score !== null) return; // Disable after submission
    setUserAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    data.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) newScore++;
    });
    setScore(newScore);
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-4">
        <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl shadow-sm">
           <BrainCircuit size={22} />
        </div>
        <div>
            <h3 className="font-bold text-xl text-slate-800">Pop Quiz</h3>
            <p className="text-xs text-slate-500 font-medium">Test your knowledge</p>
        </div>
      </div>

      {data.map((q, idx) => {
        const isSubmitted = score !== null;

        return (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</span>
                <p className="font-semibold text-slate-800 text-lg leading-snug">{q.question}</p>
            </div>
            
            <div className="space-y-2.5 pl-9">
              {q.options.map((option) => {
                let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all text-[15px] font-medium flex justify-between items-center group ";
                
                if (isSubmitted) {
                   if (option === q.answer) btnClass += "bg-green-50 border-green-400 text-green-800 shadow-sm";
                   else if (userAnswers[idx] === option) btnClass += "bg-red-50 border-red-300 text-red-800";
                   else btnClass += "bg-white border-slate-100 opacity-50 grayscale";
                } else {
                   if (userAnswers[idx] === option) btnClass += "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm";
                   else btnClass += "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(idx, option)}
                    className={btnClass}
                    disabled={isSubmitted}
                  >
                    <span>{option}</span>
                    {isSubmitted && option === q.answer && <Check size={18} className="text-green-600" />}
                    {isSubmitted && userAnswers[idx] === option && option !== q.answer && <X size={18} className="text-red-600" />}
                    {!isSubmitted && userAnswers[idx] === option && <div className="w-4 h-4 rounded-full bg-indigo-500"></div>}
                    {!isSubmitted && userAnswers[idx] !== option && <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-indigo-300"></div>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!score && score !== 0 ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(userAnswers).length < data.length}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-center text-white shadow-xl shadow-indigo-200 animate-slide-up">
            <div className="mb-2 flex justify-center">
                <Trophy size={40} className="text-yellow-300 drop-shadow-sm animate-bounce" />
            </div>
          <p className="font-bold text-2xl mb-1">
            You scored {score} / {data.length}
          </p>
          <p className="text-indigo-100 text-sm font-medium">
            {score === data.length ? "Perfect score! You're a genius! 🔥" : "Great effort! Keep practicing. 💪"}
          </p>
        </div>
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

  if (!deck || !Array.isArray(deck) || deck.length === 0) {
    // If deck is empty (after deletion), show empty state
    return (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center flex flex-col items-center gap-3">
             <div className="p-3 bg-white rounded-full shadow-sm">
                <BrainCircuit size={24} className="text-slate-400" />
             </div>
             <p className="text-slate-500 font-medium">Deck is empty.</p>
             <button 
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold hover:bg-indigo-600"
             >
                Create New Card
             </button>
             {isAdding && (
                 <div className="w-full max-w-sm mt-4 p-4 bg-white border border-slate-200 rounded-xl text-left">
                     <input 
                        className="w-full mb-2 p-2 border border-slate-200 rounded text-sm text-slate-800"
                        placeholder="Front (Question)"
                        value={newFront} onChange={e => setNewFront(e.target.value)}
                     />
                     <textarea 
                        className="w-full mb-2 p-2 border border-slate-200 rounded text-sm text-slate-800 resize-none"
                        placeholder="Back (Answer)"
                        value={newBack} onChange={e => setNewBack(e.target.value)}
                     />
                     <div className="flex gap-2">
                         <button 
                            onClick={() => {
                                if(newFront && newBack) {
                                    setDeck([{front: newFront, back: newBack}]);
                                    setNewFront(""); setNewBack(""); setIsAdding(false);
                                }
                            }}
                            className="flex-1 bg-indigo-500 text-white py-1.5 rounded text-xs font-bold"
                         >Save</button>
                         <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 border rounded text-xs">Cancel</button>
                     </div>
                 </div>
             )}
        </div>
    );
  }

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % deck.length), 300);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length), 300);
  };
  
  const handleShuffle = () => {
      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      setDeck(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
  };
  
  const handleDeleteCurrent = () => {
      const newDeck = deck.filter((_, i) => i !== currentIndex);
      setDeck(newDeck);
      if (currentIndex >= newDeck.length) setCurrentIndex(Math.max(0, newDeck.length - 1));
      setIsFlipped(false);
  };
  
  const handleAddCard = () => {
      if (!newFront.trim() || !newBack.trim()) return;
      const newCard = { front: newFront, back: newBack };
      setDeck([...deck, newCard]);
      setNewFront("");
      setNewBack("");
      setIsAdding(false);
      // Optional: Jump to new card
      setCurrentIndex(deck.length); 
  };

  return (
    <div className="w-full max-w-md mx-auto py-4">
      {/* Controls Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <RotateCw size={20} className="text-indigo-600" /> Flashcards
        </h3>
        <div className="flex items-center gap-2">
             <button onClick={handleShuffle} title="Shuffle" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                 <Shuffle size={16} />
             </button>
             <button onClick={() => setIsAdding(!isAdding)} title="Add Card" className={`p-1.5 rounded-lg transition-colors ${isAdding ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                 <Plus size={16} />
             </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
          ></div>
      </div>
      
      {/* Add Card Form */}
      {isAdding && (
         <div className="mb-6 p-4 bg-white border border-indigo-100 rounded-xl shadow-sm animate-slide-up relative z-20">
             <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2">New Card</h4>
             <input 
                className="w-full mb-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                placeholder="Front (Question)"
                value={newFront} onChange={e => setNewFront(e.target.value)}
             />
             <textarea 
                className="w-full mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none"
                placeholder="Back (Answer)"
                rows={2}
                value={newBack} onChange={e => setNewBack(e.target.value)}
             />
             <div className="flex gap-2">
                 <button 
                    onClick={handleAddCard}
                    disabled={!newFront || !newBack}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                 >
                    Add Card
                 </button>
                 <button onClick={() => setIsAdding(false)} className="px-3 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-bold">Cancel</button>
             </div>
         </div>
      )}

      {/* Card Display */}
      <div className="relative">
          <div 
            className="relative h-72 w-full perspective-1000 cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div 
              className={`
                relative w-full h-full text-center transition-transform duration-700 transform-style-3d rounded-3xl
                ${isFlipped ? 'rotate-y-180' : ''}
              `}
              style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front */}
              <div 
                className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-3xl flex flex-col items-center justify-center p-8 shadow-xl shadow-indigo-200"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="absolute top-6 left-6 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-6 right-6 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
                
                <p className="text-xs uppercase tracking-widest opacity-60 mb-6 font-semibold bg-black/20 px-3 py-1 rounded-full">Concept</p>
                <h4 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-sm select-none">{deck[currentIndex].front}</h4>
                <div className="absolute bottom-6 text-xs font-medium opacity-50 flex items-center gap-1 animate-pulse">
                    Click to flip <RotateCw size={10} />
                </div>
              </div>
    
              {/* Back */}
              <div 
                className="absolute inset-0 backface-hidden bg-white text-slate-800 border-2 border-slate-100 rounded-3xl flex flex-col items-center justify-center p-8 rotate-y-180 shadow-xl shadow-slate-200"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-xs uppercase tracking-widest text-indigo-500 mb-6 font-bold bg-indigo-50 px-3 py-1 rounded-full">Definition</p>
                <p className="text-lg leading-relaxed font-medium text-slate-700 select-none">{deck[currentIndex].back}</p>
              </div>
            </div>
          </div>
          
          {/* Delete Button (Floating) */}
          <button 
             onClick={(e) => { e.stopPropagation(); handleDeleteCurrent(); }}
             className="absolute -right-2 -top-2 p-2 bg-white text-rose-500 border border-rose-100 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
             title="Delete Card"
          >
             <Trash2 size={14} />
          </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 px-8">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="p-3 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md hover:-translate-x-1"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
             <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mb-1">
               {isFlipped ? "Answer" : "Question"}
             </p>
             <p className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                 {currentIndex + 1} / {deck.length}
             </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="p-3 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md hover:translate-x-1"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

// --- Practice Problems Component ---
export const PracticeProblemsView: React.FC<{ data: PracticeProblem[] }> = ({ data }) => {
    const [visibleHints, setVisibleHints] = useState<Record<number, boolean>>({});
    const [visibleSolutions, setVisibleSolutions] = useState<Record<number, boolean>>({});

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 flex items-center gap-2">
                <AlertCircle size={20} />
                <p>Could not load practice problems.</p>
            </div>
        );
    }

    const toggleHint = (idx: number) => {
        setVisibleHints(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const toggleSolution = (idx: number) => {
        setVisibleSolutions(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-4">
                <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl shadow-sm">
                    <Sparkles size={22} />
                </div>
                <div>
                    <h3 className="font-bold text-xl text-slate-800">Practice Problems</h3>
                    <p className="text-xs text-slate-500 font-medium">Challenge yourself</p>
                </div>
            </div>

            {data.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4 mb-4">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-800 text-white rounded-lg font-bold text-sm shadow-md mt-0.5">
                            {idx + 1}
                        </span>
                        <div className="pt-0.5">
                            <p className="font-medium text-slate-800 leading-relaxed whitespace-pre-wrap text-lg">{item.problem}</p>
                        </div>
                    </div>

                    <div className="pl-12 space-y-4">
                        {/* Actions */}
                        <div className="flex gap-3">
                            <button 
                                onClick={() => toggleHint(idx)}
                                className={`
                                    text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all border
                                    ${visibleHints[idx] 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-inner' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'}
                                `}
                            >
                                <HelpCircle size={14} />
                                {visibleHints[idx] ? 'Hide Hint' : 'Get Hint'}
                            </button>
                            <button 
                                onClick={() => toggleSolution(idx)}
                                className={`
                                    text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all border
                                    ${visibleSolutions[idx] 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-inner' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'}
                                `}
                            >
                                {visibleSolutions[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                                {visibleSolutions[idx] ? 'Hide Solution' : 'See Solution'}
                            </button>
                        </div>

                        {/* Hint Content */}
                        {visibleHints[idx] && (
                            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-sm text-amber-900 animate-slide-up flex gap-3">
                                <div className="mt-0.5"><Lightbulb size={16} className="text-amber-500 fill-amber-500" /></div>
                                <div><span className="font-bold block text-amber-700 mb-1">Hint:</span> {item.hint}</div>
                            </div>
                        )}

                        {/* Solution Content */}
                        {visibleSolutions[idx] && (
                            <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-sm text-emerald-900 animate-slide-up">
                                <p className="font-bold text-emerald-700 mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Solution:</p>
                                <div className="prose prose-sm prose-emerald max-w-none bg-white p-3 rounded-lg border border-emerald-100/50">
                                    <p className="whitespace-pre-wrap">{item.solution}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Cheat Sheet Component ---
export const CheatSheetView: React.FC<{ data: CheatSheetData }> = ({ data }) => {
    if (!data || !data.sections) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 flex items-center gap-2">
                <AlertCircle size={20} />
                <p>Could not load cheat sheet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full bg-white text-slate-900 rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm print-container">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{data.title}</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">High-Yield Cheat Sheet</p>
                    </div>
                    <div className="p-3 bg-slate-900 text-white rounded-xl">
                        <FileText size={24} />
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-700 italic leading-relaxed">
                    "{data.summary}"
                </p>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 gap-6">
                {data.sections.map((section, idx) => (
                    <div key={idx} className="break-inside-avoid">
                        <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2 border-b border-indigo-100 pb-1">
                            <Bookmark size={18} className="fill-indigo-100" />
                            {section.title}
                        </h3>
                        <ul className="space-y-2">
                            {section.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 group">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:bg-indigo-600 transition-colors flex-shrink-0"></div>
                                    <span className="font-medium leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            
            <div className="pt-8 mt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Generated by LearnBro AI
                </p>
            </div>
        </div>
    );
};