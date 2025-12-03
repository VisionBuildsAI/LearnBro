import React, { useState } from 'react';
import { Check, X, RotateCw, ChevronRight, ChevronLeft, BrainCircuit, AlertCircle, HelpCircle, Eye, EyeOff, Trophy, Sparkles } from 'lucide-react';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 flex items-center gap-2">
            <AlertCircle size={20} />
            <p>Could not load flashcards.</p>
        </div>
    );
  }

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % data.length), 300);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + data.length) % data.length), 300);
  };

  return (
    <div className="w-full max-w-md mx-auto py-4">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <RotateCw size={20} className="text-indigo-600" /> Flashcards
        </h3>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
          {currentIndex + 1} / {data.length}
        </span>
      </div>

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
            <h4 className="text-3xl font-bold leading-tight drop-shadow-sm">{data[currentIndex].front}</h4>
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
            <p className="text-lg leading-relaxed font-medium text-slate-700">{data[currentIndex].back}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 px-8">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="p-3 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md hover:-translate-x-1"
        >
          <ChevronLeft size={24} />
        </button>
        <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">
          {isFlipped ? "Answer" : "Question"}
        </p>
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

// Helper for icons
import { Lightbulb, CheckCircle2 } from 'lucide-react';