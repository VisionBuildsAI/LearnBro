import React, { useState } from 'react';
import { Check, X, RotateCw, ChevronRight, ChevronLeft, BrainCircuit, AlertCircle } from 'lucide-react';

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

// --- Quiz Component ---
export const QuizView: React.FC<{ data: QuizQuestion[] }> = ({ data }) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
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
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
           <BrainCircuit size={20} />
        </div>
        <h3 className="font-bold text-lg text-slate-800">Pop Quiz!</h3>
      </div>

      {data.map((q, idx) => {
        const isCorrect = userAnswers[idx] === q.answer;
        const isSubmitted = score !== null;

        return (
          <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-800 mb-3">{idx + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((option) => {
                let btnClass = "w-full text-left p-3 rounded-lg border transition-all text-sm ";
                
                if (isSubmitted) {
                   if (option === q.answer) btnClass += "bg-green-100 border-green-300 text-green-800";
                   else if (userAnswers[idx] === option) btnClass += "bg-red-100 border-red-300 text-red-800";
                   else btnClass += "bg-white border-slate-200 opacity-50";
                } else {
                   if (userAnswers[idx] === option) btnClass += "bg-indigo-100 border-indigo-400 text-indigo-800";
                   else btnClass += "bg-white border-slate-200 hover:bg-slate-100";
                }

                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(idx, option)}
                    className={btnClass}
                    disabled={isSubmitted}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option}</span>
                      {isSubmitted && option === q.answer && <Check size={16} className="text-green-600" />}
                      {isSubmitted && userAnswers[idx] === option && option !== q.answer && <X size={16} className="text-red-600" />}
                    </div>
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
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
          <p className="text-indigo-900 font-bold text-lg">
            You scored {score} / {data.length}
          </p>
          <p className="text-indigo-600 text-sm mt-1">
            {score === data.length ? "You're a genius! 🔥" : "Keep practicing! You got this. 💪"}
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
            <AlertCircle size={20} />
            <p>Could not load flashcards.</p>
        </div>
    );
  }

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % data.length), 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + data.length) % data.length), 200);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <RotateCw size={18} className="text-indigo-600" /> Flashcards
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {currentIndex + 1} / {data.length}
        </span>
      </div>

      <div 
        className="relative h-64 w-full perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`
            relative w-full h-full text-center transition-transform duration-500 transform-style-3d shadow-xl rounded-2xl
            ${isFlipped ? 'rotate-y-180' : ''}
          `}
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs uppercase tracking-widest opacity-75 mb-4">Concept</p>
            <h4 className="text-2xl font-bold">{data[currentIndex].front}</h4>
            <p className="text-xs opacity-50 absolute bottom-4">Tap to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden bg-white text-slate-800 border-2 border-indigo-100 rounded-2xl flex flex-col items-center justify-center p-6 rotate-y-180"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs uppercase tracking-widest text-indigo-500 mb-4">Explanation</p>
            <p className="text-lg leading-relaxed">{data[currentIndex].back}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 px-4">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <p className="text-xs text-slate-400 font-medium">
          {isFlipped ? "Answer" : "Question"}
        </p>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};