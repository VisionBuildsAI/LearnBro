import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, Sparkles, BrainCircuit, Zap,
  Settings, Image as ImageIcon, Rocket, Headphones, Mic, Share2, Search,
  Smile, User, GraduationCap, Flame, Heart, AlertTriangle, Brain, History,
  ChevronLeft, HelpCircle, RotateCw, FileText, Highlighter, PenTool, FileQuestion
} from 'lucide-react';
import { TeachingMode, ChatMessage, MasteryItem, LearningEvent } from './types';
import { sendMessageToLearnBro, gradeAndFixNotes } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';
import { QuizView, FlashcardView, PracticeProblemsView, CheatSheetView, QuestionPaperView } from './components/StudyTools';
import { TimelineView } from './components/TimelineView';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { NoteGraderView } from './components/NoteGrader';
import { BrainDashboard } from './components/BrainDashboard';
import { SmartChips } from './components/SmartChips';
import { CreateNotesModal } from './components/CreateNotesModal';

// --- Configuration & Data ---

const PERSONAS = [
  { id: TeachingMode.DEFAULT, icon: <User size={20} />, color: "text-cyan-400", bg: "bg-cyan-500", label: "Bro Mode", desc: "Best Friend" },
  { id: TeachingMode.CHILD, icon: <Smile size={20} />, color: "text-amber-400", bg: "bg-amber-500", label: "Child Mode", desc: "ELI5" },
  { id: TeachingMode.FUN, icon: <Sparkles size={20} />, color: "text-pink-400", bg: "bg-pink-500", label: "Fun Mode", desc: "Comedian" },
  { id: TeachingMode.STRICT_MOM, icon: <AlertTriangle size={20} />, color: "text-rose-500", bg: "bg-rose-600", label: "Strict Mom", desc: "Discipline" },
  { id: TeachingMode.SENIOR, icon: <GraduationCap size={20} />, color: "text-emerald-400", bg: "bg-emerald-500", label: "Senior", desc: "Mentor" },
  { id: TeachingMode.LATE_NIGHT, icon: <Heart size={20} />, color: "text-violet-400", bg: "bg-violet-500", label: "Therapy", desc: "2AM Talks" },
  { id: TeachingMode.DEEP_THINK, icon: <Brain size={20} />, color: "text-indigo-400", bg: "bg-indigo-500", label: "Deep Think", desc: "Reasoning" },
];

const TOOLS = [
  { id: 'timeline', label: 'Timeline', icon: <History size={18} />, desc: 'History', action: 'timeline', color: 'text-slate-400 group-hover:text-indigo-400', bg: 'group-hover:bg-indigo-500/20' },
  { id: 'create-notes', label: 'Create Notes', icon: <PenTool size={18} />, desc: 'Editor', action: 'create-notes', color: 'text-slate-400 group-hover:text-pink-400', bg: 'group-hover:bg-pink-500/20' },
  { id: 'quiz', label: 'Create Quiz', icon: <HelpCircle size={18} />, desc: 'Test Prep', prompt: "Create a multiple choice quiz about ", color: 'text-slate-400 group-hover:text-emerald-400', bg: 'group-hover:bg-emerald-500/20' },
  { id: 'question-paper', label: 'Question Paper', icon: <FileQuestion size={18} />, desc: 'Exam Gen', prompt: "Create a question paper on ", color: 'text-slate-400 group-hover:text-orange-400', bg: 'group-hover:bg-orange-500/20' },
  { id: 'flashcards', label: 'Flashcards', icon: <RotateCw size={18} />, desc: 'Memorize', prompt: "Create flashcards for ", color: 'text-slate-400 group-hover:text-amber-400', bg: 'group-hover:bg-amber-500/20' },
  { id: 'notes', label: 'Cheat Sheet', icon: <FileText size={18} />, desc: 'Summaries', prompt: "Create a cheat sheet for ", color: 'text-slate-400 group-hover:text-purple-400', bg: 'group-hover:bg-purple-500/20' },
  { id: 'diagram', label: 'Diagrams', icon: <ImageIcon size={18} />, desc: 'Visuals', prompt: "Generate a diagram explaining ", color: 'text-slate-400 group-hover:text-cyan-400', bg: 'group-hover:bg-cyan-500/20' },
  { id: 'grader', label: 'Check Notes', icon: <Highlighter size={18} />, desc: 'Grader', prompt: "Grade these notes: ", color: 'text-slate-400 group-hover:text-rose-400', bg: 'group-hover:bg-rose-500/20' },
];

const MOCK_MASTERY: MasteryItem[] = [
  { id: '1', topic: 'Physics', level: 68, status: 'warning' },
  { id: '2', topic: 'Calculus', level: 92, status: 'mastered' },
  { id: '3', topic: 'Chemistry', level: 45, status: 'danger' },
  { id: '4', topic: 'History', level: 88, status: 'mastered' },
  { id: '5', topic: 'Literature', level: 75, status: 'warning' },
];

const MOCK_EVENTS: LearningEvent[] = [
    { id: '1', topic: 'Quantum Mechanics', timestamp: Date.now() - 100000000, type: 'quiz', score: 85 },
    { id: '2', topic: 'French Revolution', timestamp: Date.now() - 200000000, type: 'flashcards' },
    { id: '3', topic: 'Calculus Derivatives', timestamp: Date.now() - 50000000, type: 'practice', score: 100 },
];

function App() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Yo. I'm LearnBro. What are we conquering today — grades, skills, or life?",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<TeachingMode>(TeachingMode.DEFAULT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCreateNotes, setShowCreateNotes] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
      document.documentElement.classList.add('dark');
  }, []);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSmartChip = (prompt: string) => {
    // If scanning homework, prompt user for image first
    if (prompt.includes("upload an image")) {
        fileInputRef.current?.click();
        // We'll set the text but wait for user to attach image
        setInputText(prompt);
    } else {
        handleSendMessage(prompt);
    }
  };

  const handleToolClick = (tool: typeof TOOLS[0]) => {
      if (tool.action === 'timeline') {
          setShowTimeline(true);
      } else if (tool.action === 'create-notes') {
          setShowCreateNotes(true);
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false); // Close sidebar on mobile on selection
          }
      } else if (tool.prompt) {
          setInputText(tool.prompt);
          // Small timeout to allow render then focus
          setTimeout(() => {
              textareaRef.current?.focus();
          }, 50);
          
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false); // Close sidebar on mobile on selection
          }
      }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if ((!textToSend.trim() && !inputImage) || isLoading) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      image: inputImage || undefined,
      contentType: 'text',
      timestamp: Date.now()
    };

    const tempMessages = [...messages, newMessage];
    setMessages(tempMessages);
    setInputText('');
    setInputImage(null);
    setIsLoading(true);

    try {
      const responseId = (Date.now() + 1).toString();
      // Optimistically add empty model message
      setMessages(prev => [
        ...prev,
        {
          id: responseId,
          role: 'model',
          text: '',
          contentType: 'text',
          timestamp: Date.now()
        }
      ]);

      await sendMessageToLearnBro(
        tempMessages, 
        newMessage.text,
        newMessage.image || null,
        currentMode,
        (streamedText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { ...msg, text: streamedText } : msg
          ));
        },
        (toolType, toolData) => {
            // Handle Tool Result (Quiz, Flashcards, etc.)
            // We append a NEW message for the tool component
            const toolMsgId = (Date.now() + 2).toString();
            setMessages(prev => [...prev, {
                id: toolMsgId,
                role: 'model',
                text: '',
                contentType: toolType as any,
                contentData: toolData,
                timestamp: Date.now()
            }]);
        }
      );

    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOrbColor = () => {
      const persona = PERSONAS.find(p => p.id === currentMode);
      return persona ? `${persona.color} shadow-${persona.color.split('-')[1]}-500` : 'text-cyan-400 shadow-cyan-500';
  };

  // Get current persona details
  const activePersona = PERSONAS.find(p => p.id === currentMode) || PERSONAS[0];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 bg-aurora opacity-40 pointer-events-none"></div>

      {/* --- LEFT SIDEBAR (Expanded) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 h-full glass-panel border-r border-white/5 flex flex-col transition-all duration-300
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}
      `}>
         {/* Sidebar Header */}
         <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
             {isSidebarOpen ? (
                 <div className="flex items-center gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <BrainCircuit size={18} className="text-white" />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight">LearnBro</span>
                 </div>
             ) : (
                <div className="w-full flex justify-center">
                    <BrainCircuit size={24} className="text-cyan-400" />
                </div>
             )}
             
             {/* Toggle Button */}
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
             >
                 <ChevronLeft size={16} className={`transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`} />
             </button>
         </div>

         {/* Navigation Menu */}
         <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-3 flex flex-col gap-6">
            
            {/* 1. Teaching Modes */}
            <div className="flex flex-col gap-2">
                {isSidebarOpen && <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Teaching Modes</h3>}
                {PERSONAS.map(persona => (
                    <button
                        key={persona.id}
                        onClick={() => setCurrentMode(persona.id)}
                        className={`
                            flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                            ${currentMode === persona.id 
                                ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
                        `}
                    >
                        <div className={`
                            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                            ${currentMode === persona.id ? persona.bg + ' text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'}
                        `}>
                            {persona.icon}
                        </div>
                        
                        {isSidebarOpen && (
                            <div className="text-left animate-fade-in flex-1">
                                <div className="font-bold text-sm leading-none mb-1">{persona.label}</div>
                                <div className="text-[10px] opacity-60 font-medium">{persona.desc}</div>
                            </div>
                        )}

                        {/* Active Indicator Strip */}
                        {currentMode === persona.id && (
                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${persona.bg}`}></div>
                        )}
                    </button>
                ))}
            </div>

            {/* 2. Study Tools (Updated) */}
            <div className="flex flex-col gap-2">
                {isSidebarOpen && <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Study Tools</h3>}
                
                {TOOLS.map(tool => (
                    <button 
                        key={tool.id}
                        onClick={() => handleToolClick(tool)}
                        className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group"
                    >
                         <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center transition-colors ${tool.bg} ${tool.color}`}>
                             {tool.icon}
                         </div>
                         {isSidebarOpen && (
                            <div className="text-left animate-fade-in flex-1">
                                <span className="font-bold text-sm block leading-none mb-1">{tool.label}</span>
                                <span className="text-[10px] opacity-50 font-medium">{tool.desc}</span>
                            </div>
                         )}
                    </button>
                ))}
            </div>

         </div>

         {/* Bottom User Area */}
         <div className="p-4 border-t border-white/5">
             <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors group">
                 <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-0.5">
                     <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                         <span className="font-bold text-xs">ME</span>
                     </div>
                 </div>
                 {isSidebarOpen && (
                     <div className="text-left animate-fade-in">
                         <div className="text-sm font-bold text-white">Student Account</div>
                         <div className="text-[10px] text-slate-400">Pro Plan Active</div>
                     </div>
                 )}
                 {isSidebarOpen && <Settings size={16} className="ml-auto text-slate-500 group-hover:text-white" />}
             </button>
         </div>
      </aside>


      {/* --- CENTER MAIN (Chat Zone) --- */}
      <main className={`
          flex-1 flex flex-col h-full relative z-10 min-w-0 transition-all duration-300
          ${isSidebarOpen ? 'md:ml-0' : 'md:ml-0'} 
      `}>
         
         {/* Mobile Header Overlay Trigger */}
         <div className="md:hidden absolute top-4 left-4 z-50">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-lg text-white">
                 {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
             </button>
         </div>

         {/* Top Bar */}
         <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5 bg-slate-950/50 backdrop-blur-sm z-20">
            {/* Mode Indicator & Title */}
            <div className="flex flex-col ml-10 md:ml-0 gap-1">
                 {/* Current Mode Badge */}
                 <div className={`
                    inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md w-fit animate-fade-in
                 `}>
                    <div className={`w-2 h-2 rounded-full ${activePersona.bg} shadow-[0_0_8px_currentColor] animate-pulse`}></div>
                    <span className={`text-xs font-bold uppercase tracking-wide ${activePersona.color}`}>
                        {activePersona.label}
                    </span>
                 </div>

                <h2 className="hidden sm:block text-sm text-slate-400 font-medium tracking-wide">
                    Physics <span className="text-slate-600 mx-2">•</span> Motion
                </h2>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-full">
                    <Flame size={16} className="text-amber-500 fill-amber-500 animate-pulse" />
                    <span className="text-sm font-bold text-amber-500">12</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-full">
                    <Zap size={16} className="text-indigo-400 fill-indigo-400" />
                    <span className="text-sm font-bold text-indigo-400">85%</span>
                </div>
                <button onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} className="xl:hidden p-2 text-slate-400 hover:text-white">
                    <BrainCircuit size={24} />
                </button>
            </div>
         </header>

         {/* Chat Messages Area */}
         <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 scrollbar-hide">
            <div className="max-w-3xl mx-auto space-y-8 pb-32">
                
                {messages.map((msg, index) => (
                    <div 
                        key={msg.id} 
                        className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {/* AI Avatar Orb for Model messages */}
                        {msg.role === 'model' && (
                            <div className={`mb-1 relative`}>
                                <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-slate-900 shadow-[0_0_15px_currentColor] ${getOrbColor()} animate-orb`}>
                                    <BrainCircuit size={16} />
                                </div>
                            </div>
                        )}

                        <div className={`
                            max-w-[95%] md:max-w-[85%] rounded-3xl p-5 md:p-6 relative overflow-hidden shadow-2xl
                            ${msg.role === 'user' 
                                ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-sm' 
                                : 'glass-panel text-slate-200 rounded-tl-sm border border-white/5'}
                        `}>
                            {msg.image && (
                                <img src={msg.image} alt="Uploaded" className="max-h-60 rounded-xl mb-4 border border-white/10" />
                            )}
                            
                            <div className="relative z-10">
                                {msg.contentType === 'quiz' && msg.contentData ? (
                                    <QuizView data={msg.contentData} />
                                ) : msg.contentType === 'flashcards' && msg.contentData ? (
                                    <FlashcardView data={msg.contentData} />
                                ) : msg.contentType === 'practice' && msg.contentData ? (
                                    <PracticeProblemsView data={msg.contentData} />
                                ) : msg.contentType === 'cheatsheet' && msg.contentData ? (
                                    <CheatSheetView data={msg.contentData} />
                                ) : msg.contentType === 'question-paper' && msg.contentData ? (
                                    <QuestionPaperView data={msg.contentData} />
                                ) : msg.contentType === 'note-correction' && msg.contentData ? (
                                    <NoteGraderView data={msg.contentData} />
                                ) : msg.role === 'user' ? (
                                    <p className="text-lg leading-relaxed font-medium">{msg.text}</p>
                                ) : (
                                    <MarkdownRenderer content={msg.text} />
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start gap-4 animate-fade-in">
                         <div className={`w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-[0_0_15px_currentColor] ${getOrbColor()} animate-orb`}>
                            <BrainCircuit size={16} />
                        </div>
                        <div className="glass-panel px-6 py-4 rounded-3xl rounded-tl-sm flex items-center gap-2">
                             <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                             <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                             <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
         </div>

         {/* Input Zone */}
         <div className="absolute bottom-6 left-0 right-0 z-30 px-4 md:px-0 pointer-events-none">
             <div className="max-w-3xl mx-auto flex flex-col gap-4 pointer-events-auto">
                 
                 {/* Smart Chips */}
                 <SmartChips onSelect={handleSmartChip} />

                 {/* Floating Glass Input */}
                 <div className="glass-panel rounded-[2rem] p-2 pl-6 flex items-end gap-3 shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden group bg-slate-900/80 backdrop-blur-xl">
                     
                     {/* Input Glow */}
                     <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>

                     {inputImage && (
                        <div className="absolute -top-32 left-4 p-2 bg-slate-900 rounded-xl border border-slate-700 animate-slide-up shadow-xl">
                             <img src={inputImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                             <button onClick={() => setInputImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full"><X size={12}/></button>
                        </div>
                     )}

                     <div className="flex items-center gap-2 mb-2">
                         <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-full hover:bg-white/5">
                             <ImageIcon size={20} />
                             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                         </button>
                         <button onClick={() => setIsLiveMode(true)} className="text-slate-400 hover:text-rose-400 transition-colors p-2 rounded-full hover:bg-white/5">
                             <Headphones size={20} />
                         </button>
                     </div>

                     <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={inputImage ? "Ask about this image..." : "Ask LearnBro anything..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 resize-none max-h-32 min-h-[44px] py-3 text-lg font-medium scrollbar-hide"
                        rows={1}
                     />

                     <button 
                        onClick={() => handleSendMessage()}
                        disabled={(!inputText.trim() && !inputImage) || isLoading}
                        className={`
                            h-12 w-12 rounded-full flex items-center justify-center mb-1 transition-all duration-300
                            ${(!inputText.trim() && !inputImage) || isLoading
                                ? 'bg-slate-800 text-slate-600' 
                                : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:scale-110 active:scale-95'
                            }
                        `}
                     >
                         <Rocket size={20} className={(!inputText.trim() && !inputImage) ? "" : "ml-0.5"} />
                     </button>
                 </div>
                 
                 <p className="text-center text-[10px] text-slate-600 font-medium tracking-wide">
                    AI can make mistakes. Verify important info.
                 </p>
             </div>
         </div>
      </main>

      {/* --- RIGHT PANEL (Brain Dashboard) --- */}
      <aside className={`
         fixed inset-y-0 right-0 z-40 w-80 glass-panel border-l border-white/5 transition-transform duration-300
         xl:relative xl:translate-x-0
         ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
          <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <span className="font-display font-bold text-lg">Brain Stats</span>
                  <button onClick={() => setIsRightPanelOpen(false)} className="xl:hidden p-1 text-slate-400"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-hidden">
                  <BrainDashboard 
                      masteryData={MOCK_MASTERY}
                      streak={12}
                      brainEnergy={85}
                  />
              </div>
          </div>
      </aside>
      
      {/* Modals */}
      {isLiveMode && <LiveVoiceModal onClose={() => setIsLiveMode(false)} />}
      {showTimeline && <TimelineView events={MOCK_EVENTS} onClose={() => setShowTimeline(false)} />}
      {showCreateNotes && <CreateNotesModal onClose={() => setShowCreateNotes(false)} />}

    </div>
  );
}

export default App;