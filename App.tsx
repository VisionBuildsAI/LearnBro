import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, Sparkles, BrainCircuit, Zap,
  Settings, Image as ImageIcon, Rocket, Headphones, Mic, Share2, Search,
  Smile, User, GraduationCap, Flame, Heart, AlertTriangle, Brain, History,
  ChevronLeft, HelpCircle, RotateCw, FileText, Highlighter, PenTool, FileQuestion,
  Activity, Command, Cpu, Paperclip, Download
} from 'lucide-react';
import { TeachingMode, ChatMessage, MasteryItem, LearningEvent, Attachment } from './types';
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
  { id: TeachingMode.DEFAULT, icon: <User size={20} />, color: "text-cyan-400", bg: "bg-cyan-500", glow: "shadow-cyan-500/50", label: "Bro Mode", desc: "Best Friend" },
  { id: TeachingMode.CHILD, icon: <Smile size={20} />, color: "text-amber-400", bg: "bg-amber-500", glow: "shadow-amber-500/50", label: "Child Mode", desc: "ELI5" },
  { id: TeachingMode.FUN, icon: <Sparkles size={20} />, color: "text-pink-400", bg: "bg-pink-500", glow: "shadow-pink-500/50", label: "Fun Mode", desc: "Comedian" },
  { id: TeachingMode.STRICT_MOM, icon: <AlertTriangle size={20} />, color: "text-rose-500", bg: "bg-rose-600", glow: "shadow-rose-500/50", label: "Strict Mom", desc: "Discipline" },
  { id: TeachingMode.SENIOR, icon: <GraduationCap size={20} />, color: "text-emerald-400", bg: "bg-emerald-500", glow: "shadow-emerald-500/50", label: "Senior", desc: "Mentor" },
  { id: TeachingMode.LATE_NIGHT, icon: <Heart size={20} />, color: "text-violet-400", bg: "bg-violet-500", glow: "shadow-violet-500/50", label: "Therapy", desc: "2AM Talks" },
  { id: TeachingMode.DEEP_THINK, icon: <Brain size={20} />, color: "text-indigo-400", bg: "bg-indigo-500", glow: "shadow-indigo-500/50", label: "Deep Think", desc: "Reasoning" },
];

const TOOLS = [
  { id: 'timeline', label: 'Timeline', icon: <History size={20} />, desc: 'History', action: 'timeline', color: 'text-indigo-400', bg: 'hover:bg-indigo-500/10 hover:border-indigo-500/30' },
  { id: 'create-notes', label: 'Editor', icon: <PenTool size={20} />, desc: 'Draft Notes', action: 'create-notes', color: 'text-pink-400', bg: 'hover:bg-pink-500/10 hover:border-pink-500/30' },
  { id: 'quiz', label: 'Quiz', icon: <HelpCircle size={20} />, desc: 'Test Prep', prompt: "Create a multiple choice quiz about ", color: 'text-emerald-400', bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/30' },
  { id: 'question-paper', label: 'Exams', icon: <FileQuestion size={20} />, desc: 'Generator', prompt: "Create a question paper on ", color: 'text-orange-400', bg: 'hover:bg-orange-500/10 hover:border-orange-500/30' },
  { id: 'flashcards', label: 'Cards', icon: <RotateCw size={20} />, desc: 'Memorize', prompt: "Create flashcards for ", color: 'text-amber-400', bg: 'hover:bg-amber-500/10 hover:border-amber-500/30' },
  { id: 'notes', label: 'Cheatsheet', icon: <FileText size={20} />, desc: 'Summaries', prompt: "Create a cheat sheet for ", color: 'text-purple-400', bg: 'hover:bg-purple-500/10 hover:border-purple-500/30' },
  { id: 'diagram', label: 'Visuals', icon: <ImageIcon size={20} />, desc: 'Diagrams', prompt: "Generate a diagram explaining ", color: 'text-cyan-400', bg: 'hover:bg-cyan-500/10 hover:border-cyan-500/30' },
  { id: 'grader', label: 'Grader', icon: <Highlighter size={20} />, desc: 'Check Notes', prompt: "Grade these notes: ", color: 'text-rose-400', bg: 'hover:bg-rose-500/10 hover:border-rose-500/30' },
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

declare const html2pdf: any;

function App() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "System Online. Welcome to LearningBro AI. Select a mission objective.",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputAttachment, setInputAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<TeachingMode>(TeachingMode.DEFAULT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Collapsed by default
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCreateNotes, setShowCreateNotes] = useState(false);
  const [downloadingMsgId, setDownloadingMsgId] = useState<string | null>(null);

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
        setInputAttachment({
            mimeType: file.type,
            data: reader.result as string,
            name: file.name
        });
        
        // Auto-set prompt if empty
        if (!inputText) {
             if (file.type === 'application/pdf') {
                 setInputText("Uploaded. Please solve all questions, or I will ask for specific ones like 'Q2' or 'Section B'.");
             } else {
                 setInputText("Analyze this image.");
             }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSmartChip = (prompt: string) => {
    if (prompt.includes("upload an image") || prompt.includes("Solve PDF")) {
        fileInputRef.current?.click();
        if (prompt.includes("Solve PDF")) {
            setInputText("Solve this paper. Break it down by sections and provide step-by-step solutions for each question.");
        } else {
            setInputText(prompt);
        }
    } else {
        handleSendMessage(prompt);
    }
  };

  const handleToolClick = (tool: typeof TOOLS[0]) => {
      if (tool.action === 'timeline') {
          setShowTimeline(true);
      } else if (tool.action === 'create-notes') {
          setShowCreateNotes(true);
      } else if (tool.prompt) {
          setInputText(tool.prompt);
          setTimeout(() => {
              textareaRef.current?.focus();
          }, 50);
      }
  };

  const handleDownloadPdf = async (msgId: string) => {
      if (typeof html2pdf === 'undefined') {
          alert("PDF Generator is initializing. Please try again in a moment.");
          return;
      }

      setDownloadingMsgId(msgId);
      const element = document.getElementById(`msg-content-${msgId}`);
      
      if (element) {
          const opt = {
              margin: 0.5,
              filename: `LearnBro_Content_${msgId}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          };
          
          try {
              await html2pdf().set(opt).from(element).save();
          } catch (e) {
              console.error("PDF download failed", e);
          }
      }
      setDownloadingMsgId(null);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if ((!textToSend.trim() && !inputAttachment) || isLoading) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      attachment: inputAttachment || undefined,
      contentType: 'text',
      timestamp: Date.now()
    };

    const tempMessages = [...messages, newMessage];
    setMessages(tempMessages);
    setInputText('');
    setInputAttachment(null);
    setIsLoading(true);

    try {
      const responseId = (Date.now() + 1).toString();
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
        newMessage.attachment || null,
        currentMode,
        (streamedText) => {
          setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { ...msg, text: streamedText } : msg
          ));
        },
        (toolType, toolData) => {
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

  // Get current persona details
  const activePersona = PERSONAS.find(p => p.id === currentMode) || PERSONAS[0];

  return (
    <div className="flex h-screen overflow-hidden bg-[#030712] text-slate-100 font-sans relative selection:bg-cyan-500/30">
      
      {/* --- CYBER BACKGROUND LAYER --- */}
      <div className="cyber-grid opacity-30 pointer-events-none fixed inset-0 z-0"></div>
      
      {/* Dynamic Ambient Glow based on Persona */}
      <div className={`fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-15 pointer-events-none transition-colors duration-1000 ${activePersona.bg}`}></div>
      <div className={`fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px] opacity-10 pointer-events-none transition-colors duration-1000 ${activePersona.bg}`}></div>

      {/* --- LEFT SIDEBAR (Ultra Slim / Expandable) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 h-full flex flex-col transition-all duration-300 border-r border-white/5 bg-black/60 backdrop-blur-xl
        ${isSidebarOpen ? 'w-64' : 'w-20'}
      `}>
         {/* Logo Area */}
         <div className="h-20 flex items-center justify-center border-b border-white/5 relative">
             <div className={`
                w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center shadow-lg
                ${isSidebarOpen ? 'mr-3' : 'mr-0'} transition-all duration-500
             `}>
                 <BrainCircuit size={20} className={`text-white transition-colors duration-500 ${activePersona.color}`} />
             </div>
             {isSidebarOpen && (
                 <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 animate-fade-in">
                    LearnBro
                 </span>
             )}
             
             {/* Toggle */}
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-50"
             >
                 <ChevronLeft size={12} className={`transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`} />
             </button>
         </div>

         {/* Mode Selector (Orbs) */}
         <div className="flex-1 overflow-y-auto scrollbar-hide py-6 flex flex-col gap-4 items-center w-full">
            {isSidebarOpen && <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest w-full px-6 mb-2">Neural Link</h3>}
            
            {PERSONAS.map(persona => (
                <button
                    key={persona.id}
                    onClick={() => setCurrentMode(persona.id)}
                    className={`
                        relative group flex items-center transition-all duration-300
                        ${isSidebarOpen ? 'w-full px-4' : 'w-12 justify-center'}
                    `}
                >
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border
                        ${currentMode === persona.id 
                            ? `${persona.bg} text-white border-white/20 ${persona.glow} scale-110` 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/20'}
                    `}>
                        {persona.icon}
                    </div>
                    
                    {isSidebarOpen ? (
                        <div className="ml-3 text-left animate-fade-in flex-1">
                            <div className={`text-sm font-bold ${currentMode === persona.id ? 'text-white' : 'text-slate-400'}`}>{persona.label}</div>
                            <div className="text-[10px] opacity-50 truncate">{persona.desc}</div>
                        </div>
                    ) : (
                        // Tooltip for collapsed state
                        <div className="absolute left-14 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl backdrop-blur-md">
                            {persona.label}
                        </div>
                    )}
                </button>
            ))}
         </div>

         {/* Quick Actions / Footer */}
         <div className="p-4 border-t border-white/5 flex flex-col gap-2 items-center">
             <button className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform hover:shadow-violet-500/30">
                 <Settings size={18} />
             </button>
         </div>
      </aside>


      {/* --- CENTER STAGE (Main Chat) --- */}
      <main className={`
          flex-1 flex flex-col h-full relative z-10 transition-all duration-300
          ${isSidebarOpen ? 'md:ml-64 ml-0' : 'md:ml-20 ml-0'} 
          ${isRightPanelOpen ? 'lg:mr-80 mr-0' : 'mr-0'}
      `}>
         
         {/* Top Glass Header */}
         <header className="h-16 flex items-center justify-between px-6 md:px-8 z-20 backdrop-blur-sm border-b border-white/5 sticky top-0">
            {/* Mobile Sidebar Toggle */}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-400">
                <Menu size={20} />
            </button>

            <div className="flex items-center gap-4">
                <div className={`hidden md:flex px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md items-center gap-2 ${activePersona.color}`}>
                   <Activity size={14} className="animate-pulse" />
                   <span className="text-xs font-mono font-bold uppercase tracking-wider">{activePersona.label} Active</span>
                </div>
            </div>
            
            <button 
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} 
                className={`p-2 rounded-lg transition-colors ${isRightPanelOpen ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'}`}
            >
                <Command size={18} />
            </button>
         </header>

         {/* Chat Area */}
         <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 scrollbar-hide relative w-full">
            <div className="max-w-4xl mx-auto space-y-10 pb-48">
                {messages.map((msg, index) => (
                    <div 
                        key={msg.id} 
                        className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className={`flex items-end gap-4 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            
                            {/* Avatar */}
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg
                                ${msg.role === 'model' 
                                    ? `bg-slate-900 ${activePersona.color} ${activePersona.glow}` 
                                    : 'bg-white text-slate-900'}
                            `}>
                                {msg.role === 'model' ? <BrainCircuit size={16} /> : <User size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={`
                                p-5 md:p-6 rounded-2xl border backdrop-blur-md shadow-2xl relative overflow-hidden group w-full
                                ${msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-400/30 text-white rounded-tr-sm' 
                                    : 'glass-panel text-slate-200 rounded-tl-sm border-white/10 hover:border-white/20'}
                            `}>
                                {/* Download PDF Button (Only for Model messages) */}
                                {msg.role === 'model' && (
                                    <button 
                                        onClick={() => handleDownloadPdf(msg.id)}
                                        disabled={downloadingMsgId === msg.id}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-50"
                                        title="Download as PDF"
                                    >
                                        {downloadingMsgId === msg.id ? <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Download size={14} />}
                                    </button>
                                )}

                                {/* Attachment Render */}
                                {msg.attachment && (
                                    <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                                        {msg.attachment.mimeType === 'application/pdf' ? (
                                            <div className="bg-slate-900/50 p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/50 text-red-400">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-bold text-sm truncate">{msg.attachment.name || 'Document.pdf'}</p>
                                                    <p className="text-xs text-slate-400 font-mono">PDF DOCUMENT</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={msg.attachment.data} alt="Upload" className="w-full h-auto" />
                                        )}
                                    </div>
                                )}
                                
                                {/* Content - Wrapped for PDF Generation */}
                                <div id={`msg-content-${msg.id}`} className="relative z-10 text-base md:text-lg leading-relaxed font-light">
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
                                    ) : msg.contentType === 'image' && msg.contentData ? (
                                        <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                            <img src={msg.contentData} alt="AI Generated Diagram" className="w-full h-auto" />
                                            <div className="p-2 bg-black/50 text-xs text-center text-slate-400 font-mono">
                                                AI GENERATED DIAGRAM
                                            </div>
                                        </div>
                                    ) : msg.role === 'user' ? (
                                        <p>{msg.text}</p>
                                    ) : (
                                        <MarkdownRenderer content={msg.text} />
                                    )}
                                </div>

                                {/* Tech Decorations for AI Msg */}
                                {msg.role === 'model' && (
                                    <>
                                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                            <Cpu size={24} />
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start gap-4 animate-fade-in">
                         <div className={`w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center ${activePersona.glow} ${activePersona.color}`}>
                            <BrainCircuit size={16} className="animate-spin-slow" />
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

         {/* --- COMMAND CENTER (Input) --- */}
         <div className="absolute bottom-6 left-0 right-0 z-30 px-4 md:px-6 pointer-events-none">
             <div className="max-w-3xl mx-auto flex flex-col gap-4 pointer-events-auto">
                 
                 {/* Smart Chips - Updated with PDF Solver */}
                 <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0" style={{ maskImage: 'linear-gradient(to right, transparent, black 10px, black 95%, transparent)' }}>
                      <button onClick={() => handleSmartChip("Solve PDF Paper")} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 glass-panel rounded-full text-xs font-bold text-slate-300 transition-all duration-300 border border-white/5 hover:border-red-500/50 hover:bg-red-500/10 hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20 group whitespace-nowrap">
                          <div className="group-hover:scale-110 transition-transform duration-300"><FileText size={14} className="text-red-400" /></div>
                          <span>Solve PDF Paper</span>
                      </button>
                      <SmartChips onSelect={handleSmartChip} />
                 </div>

                 {/* The Input Capsule */}
                 <div className="glass-panel rounded-[24px] p-2 pl-4 flex items-end gap-2 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-visible group bg-[#0a0a0f]/80 backdrop-blur-2xl transition-all duration-300 focus-within:border-cyan-500/30 focus-within:shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] ring-1 ring-white/5">
                     
                     {/* Preview Attachment */}
                     {inputAttachment && (
                        <div className="absolute -top-24 left-0 p-2 glass-panel rounded-xl animate-slide-up border border-white/10 shadow-xl">
                             {inputAttachment.mimeType === 'application/pdf' ? (
                                <div className="w-16 h-16 bg-red-500/10 rounded-lg flex flex-col items-center justify-center border border-red-500/30">
                                    <FileText size={24} className="text-red-400"/>
                                    <span className="text-[8px] mt-1 text-red-200 font-bold">PDF</span>
                                </div>
                             ) : (
                                <img src={inputAttachment.data} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                             )}
                             <button onClick={() => setInputAttachment(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full hover:scale-110 transition-transform shadow-lg"><X size={10}/></button>
                        </div>
                     )}

                     <div className="flex items-center gap-1 mb-1.5">
                         <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 p-2.5 rounded-xl transition-all group/icon">
                             <Paperclip size={20} className="group-hover/icon:hidden"/>
                             <ImageIcon size={20} className="hidden group-hover/icon:block"/>
                             <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                         </button>
                         <button onClick={() => setIsLiveMode(true)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2.5 rounded-xl transition-all relative">
                             <Headphones size={20} />
                             <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                         </button>
                     </div>

                     <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={inputAttachment ? (inputAttachment.mimeType === 'application/pdf' ? "Ask about this PDF..." : "Analyze this image...") : "Initiate learning sequence..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 resize-none max-h-32 min-h-[50px] py-3.5 text-lg font-medium scrollbar-hide font-display tracking-wide"
                        rows={1}
                     />

                     <button 
                        onClick={() => handleSendMessage()}
                        disabled={(!inputText.trim() && !inputAttachment) || isLoading}
                        className={`
                            h-12 w-12 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-300
                            ${(!inputText.trim() && !inputAttachment) || isLoading
                                ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                                : `bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg hover:scale-105 hover:shadow-cyan-500/30`
                            }
                        `}
                     >
                         <Rocket size={20} className={(!inputText.trim() && !inputAttachment) ? "" : "ml-0.5"} />
                     </button>
                 </div>
                 
                 <div className="flex justify-center gap-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest opacity-60">
                    <span>AI Model: Gemini 2.5 Flash</span>
                    <span className="opacity-50">•</span>
                    <span>Latency: &lt;50ms</span>
                 </div>
             </div>
         </div>
      </main>

      {/* --- RIGHT PANEL (Tools & HUD) --- */}
      <aside className={`
         fixed inset-y-0 right-0 z-40 h-full bg-black/60 backdrop-blur-xl border-l border-white/5 transition-transform duration-300 flex flex-col
         ${isRightPanelOpen ? 'w-80 translate-x-0' : 'w-80 translate-x-full'}
      `}>
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                  <h2 className="font-display font-bold text-lg tracking-wide text-white">Neural Dashboard</h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">System Optimal</p>
              </div>
              <button onClick={() => setIsRightPanelOpen(false)} className="lg:hidden p-1 text-slate-400"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">
              
              {/* Brain HUD */}
              <BrainDashboard 
                  masteryData={MOCK_MASTERY}
                  streak={12}
                  brainEnergy={85}
              />

              {/* Tools Grid */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Active Modules</h3>
                  <div className="grid grid-cols-2 gap-2">
                      {TOOLS.map(tool => (
                          <button
                             key={tool.id}
                             onClick={() => handleToolClick(tool)}
                             className={`
                                flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 transition-all duration-300 group
                                ${tool.bg}
                             `}
                          >
                              <div className={`mb-2 ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                                  {tool.icon}
                              </div>
                              <span className="text-xs font-bold text-slate-300 group-hover:text-white">{tool.label}</span>
                          </button>
                      ))}
                  </div>
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