import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Menu, 
  X, 
  Sparkles, 
  BookOpen, 
  BrainCircuit, 
  GraduationCap, 
  Zap,
  Trash2,
  MoreVertical,
  Layers,
  Palette,
  PenTool,
  CheckCircle2,
  MessageSquare,
  Moon,
  Sun,
  Rocket,
  Mic,
  Camera,
  Heart,
  Flame,
  Clock,
  Music,
  Smile,
  Frown
} from 'lucide-react';
import { TeachingMode, ChatMessage } from './types';
import { sendMessageToLearnBro, generateStudyMaterial, generateDiagram } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';
import { QuizView, FlashcardView, PracticeProblemsView } from './components/StudyTools';

// --- Configuration & Data ---

const SUGGESTIONS = [
  "Explain Quantum Physics Like I’m 5",
  "Solve This Math Problem",
  "Make Me a Revision Plan",
  "Build a Python Script",
  "Help Me Start a Business"
];

const PERSONAS = [
  { id: TeachingMode.DEFAULT, icon: <Smile size={20} />, color: "from-indigo-400 to-blue-500", label: "Best Friend", desc: "Friendly & Supportive" },
  { id: TeachingMode.ELI5, icon: <BookOpen size={20} />, color: "from-orange-400 to-amber-500", label: "Explain Like I'm 5", desc: "Simple & Cute" },
  { id: TeachingMode.COMEDIAN, icon: <Sparkles size={20} />, color: "from-pink-500 to-rose-500", label: "Comedian", desc: "Roasts & Jokes" },
  { id: TeachingMode.STRICT_MOM, icon: <Frown size={20} />, color: "from-red-500 to-red-700", label: "Strict Mom", desc: "Tough Love" },
  { id: TeachingMode.SENIOR, icon: <GraduationCap size={20} />, color: "from-emerald-400 to-teal-500", label: "Senior Mentor", desc: "Wisdom & Hacks" },
  { id: TeachingMode.LATE_NIGHT, icon: <Moon size={20} />, color: "from-violet-600 to-purple-800", label: "2AM Therapy", desc: "Deep & Chill" },
];

// --- Components ---

const InputModal = ({ isOpen, onClose, title, placeholder, onConfirm }: { isOpen: boolean; onClose: () => void; title: string; placeholder: string; onConfirm: (val: string) => void }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
      if(isOpen) setValue("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="glass-panel rounded-3xl w-full max-w-md p-8 shadow-2xl scale-100 animate-slide-up relative overflow-hidden dark:text-white">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <h3 className="text-2xl font-bold mb-2 relative z-10 font-display">{title}</h3>
        <p className="text-sm opacity-70 mb-6 relative z-10">What topic should we focus on today?</p>
        
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
             if(e.key === 'Enter' && value.trim()) {
                 onConfirm(value);
                 onClose();
             }
          }}
          placeholder={placeholder}
          className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg relative z-10"
        />
        <div className="flex justify-end gap-3 relative z-10">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 opacity-70 hover:opacity-100 font-medium transition-opacity"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
                if (value.trim()) {
                    onConfirm(value);
                    onClose();
                }
            }}
            disabled={!value.trim()}
            className="px-7 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

const StreakCounter = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-full">
    <Flame size={14} className="text-orange-500 animate-pulse" />
    <span className="text-xs font-bold text-orange-700 dark:text-orange-400">12 Day Streak</span>
  </div>
);

const MoodIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-full">
    <BrainCircuit size={14} className="text-indigo-500" />
    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Focus: High</span>
  </div>
);

function App() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Yo! I'm LearnBro. What are we crushing today? Math, Code, Life, or Money? 🚀",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<TeachingMode>(TeachingMode.DEFAULT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true; // Default to dark mode for that premium feel
  });

  // Modal State
  const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      title: "",
      placeholder: "",
      onConfirm: (val: string) => {}
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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

  const clearChat = () => {
    setMessages([{
      id: 'welcome-reset',
      role: 'model',
      text: "Chat cleared! Fresh start. What's next, boss?",
      timestamp: Date.now()
    }]);
    setIsSidebarOpen(false);
  };

  const handleGenerateStudyTool = (type: 'quiz' | 'flashcards' | 'practice') => {
    setIsSidebarOpen(false);
    setModalConfig({
        isOpen: true,
        title: `Generate ${type === 'quiz' ? 'Quiz' : type === 'flashcards' ? 'Flashcards' : 'Practice Problems'}`,
        placeholder: "Enter a topic (e.g. World War II, Calculus)...",
        onConfirm: (topic) => executeStudyToolGeneration(topic, type)
    });
  };

  const executeStudyToolGeneration = async (topic: string, type: 'quiz' | 'flashcards' | 'practice') => {
    setIsLoading(true);

    const userMsgId = Date.now().toString();
    const typeLabel = type === 'quiz' ? 'quiz' : type === 'flashcards' ? 'flashcards' : 'practice problems';
    
    setMessages(prev => [...prev, {
        id: userMsgId,
        role: 'user',
        text: `Generate ${typeLabel} for: ${topic}`,
        timestamp: Date.now()
    }]);

    try {
        const data = await generateStudyMaterial(topic, type);
        
        let responseText = "";
        if (type === 'quiz') responseText = `Here is a quick quiz on ${topic}. Good luck!`;
        else if (type === 'flashcards') responseText = `Here are your flashcards for ${topic}. Study up!`;
        else responseText = `Here are some practice problems for ${topic}. Let's solve 'em!`;

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            contentType: type,
            contentData: data,
            timestamp: Date.now()
        }]);
    } catch (e) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "Sorry bro, couldn't generate that right now. Try again?",
            timestamp: Date.now()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateDiagram = () => {
    setIsSidebarOpen(false);
    setModalConfig({
        isOpen: true,
        title: "Generate Diagram",
        placeholder: "What diagram do you need? (e.g. Photosynthesis)...",
        onConfirm: (topic) => executeDiagramGeneration(topic)
    });
  };

  const executeDiagramGeneration = async (topic: string) => {
    setIsLoading(true);

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
        id: userMsgId,
        role: 'user',
        text: `Generate a diagram for: ${topic}`,
        timestamp: Date.now()
    }]);

    try {
        const result = await generateDiagram(topic);
        
        if (result && result.image) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: result.text,
                contentType: 'image',
                image: result.image,
                timestamp: Date.now()
            }]);
        } else {
            throw new Error("No image generated");
        }
    } catch (e) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "My bad, I couldn't draw that right now. Maybe try a simpler topic?",
            timestamp: Date.now()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !inputImage) || isLoading) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
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
        }
      );

    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: "My bad, something glitched out. Check your connection or the API key? 😵",
          timestamp: Date.now()
        }
      ]);
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

  return (
    <div className={`flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-500`}>
      {/* Background with Aurora Effect */}
      <div className="absolute inset-0 z-0 bg-aurora"></div>
      
      {/* Input Modal */}
      <InputModal 
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({...prev, isOpen: false}))}
          title={modalConfig.title}
          placeholder={modalConfig.placeholder}
          onConfirm={modalConfig.onConfirm}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Floating Sidebar --- */}
      <aside className={`
        fixed inset-y-4 left-4 z-40 w-80 glass-nav rounded-3xl transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        md:relative md:translate-x-0 md:inset-0 md:rounded-none md:shadow-none md:bg-transparent md:backdrop-blur-none md:border-r-0 md:flex
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="p-6 md:p-8 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
               <BrainCircuit size={24} />
             </div>
             <div>
               <h1 className="font-display font-bold text-xl tracking-tight">LearnBro</h1>
               <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">AI Tutor</p>
             </div>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-8 scrollbar-hide pb-6">
          
          {/* Stats & Actions */}
          <div className="flex items-center gap-3">
             <StreakCounter />
             <MoodIndicator />
          </div>

          {/* Persona Selector */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Personas</h3>
            <div className="space-y-2">
              {PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => { setCurrentMode(persona.id); setIsSidebarOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border group relative overflow-hidden
                    ${currentMode === persona.id 
                      ? 'bg-white/80 dark:bg-slate-800/80 border-indigo-500/30 shadow-lg shadow-indigo-500/10' 
                      : 'border-transparent hover:bg-white/40 dark:hover:bg-slate-800/40'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md transition-transform group-hover:scale-110
                    ${persona.color}
                  `}>
                    {persona.icon}
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-semibold text-sm ${currentMode === persona.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {persona.label}
                    </p>
                    <p className="text-[10px] opacity-60 font-medium">{persona.desc}</p>
                  </div>
                  {currentMode === persona.id && (
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tools Grid */}
          <div>
             <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Quick Tools</h3>
             <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'quiz', icon: <BrainCircuit size={18} />, label: "Quiz", color: "text-blue-500" },
                  { id: 'flashcards', icon: <Layers size={18} />, label: "Cards", color: "text-purple-500" },
                  { id: 'practice', icon: <PenTool size={18} />, label: "Practice", color: "text-emerald-500" },
                  { id: 'diagram', icon: <Palette size={18} />, label: "Diagram", color: "text-pink-500" },
                ].map((tool) => (
                   <button 
                     key={tool.id}
                     onClick={tool.id === 'diagram' ? handleGenerateDiagram : () => handleGenerateStudyTool(tool.id as any)}
                     className="glass-panel p-3 rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform duration-200 border-transparent hover:border-white/40"
                   >
                      <div className={`p-2 bg-slate-100 dark:bg-slate-800 rounded-full ${tool.color}`}>{tool.icon}</div>
                      <span className="text-xs font-semibold opacity-80">{tool.label}</span>
                   </button>
                ))}
             </div>
          </div>
          
           {/* Pro Tip Card */}
           <div className="relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-br from-cyan-400 to-indigo-500">
              <div className="bg-white dark:bg-slate-900 rounded-[14px] p-4 h-full relative z-10">
                 <div className="flex items-center gap-2 mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500 font-bold text-xs uppercase tracking-wider">
                   <Zap size={14} className="text-cyan-500" /> Pro Tip
                 </div>
                 <p className="text-xs font-medium opacity-80 leading-relaxed">
                    Upload a photo of your homework and I'll explain step-by-step.
                 </p>
              </div>
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </div>

           <button 
                onClick={clearChat}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs font-bold uppercase tracking-wider"
              >
                <Trash2 size={14} /> Clear History
            </button>
        </div>
      </aside>

      {/* --- Main Chat Area --- */}
      <main className="flex-1 flex flex-col h-full relative z-10">
        
        {/* Mobile Header */}
        <header className="md:hidden p-4 flex items-center justify-between glass-panel mx-4 mt-4 rounded-2xl z-20">
           <div className="flex items-center gap-2">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl active:bg-slate-200 dark:active:bg-slate-700">
               <Menu size={20} />
             </button>
             <span className="font-display font-bold">LearnBro</span>
           </div>
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>
        </header>

        {/* Desktop Theme Toggle (Floating) */}
        <div className="hidden md:block absolute top-6 right-8 z-20">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full glass-panel shadow-lg hover:scale-110 transition-transform text-slate-600 dark:text-slate-300"
            >
               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-16 scrollbar-hide pb-40">
           <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {msg.role === 'model' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-0.5 mr-4 flex-shrink-0 self-start shadow-glow">
                      <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                        <BrainCircuit size={18} className="text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`
                    max-w-[85%] md:max-w-[75%] rounded-3xl p-6 shadow-sm relative overflow-hidden group
                    ${msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-md shadow-indigo-500/20' 
                      : 'glass-panel text-slate-800 dark:text-slate-100 rounded-bl-md'}
                  `}>
                    {msg.image && (
                       <img src={msg.image} alt="Upload" className="rounded-xl mb-4 max-h-64 object-contain bg-black/10 dark:bg-black/30 border border-white/10" />
                    )}

                    <div className="relative z-10">
                        {msg.contentType === 'quiz' && msg.contentData ? (
                            <QuizView data={msg.contentData} />
                        ) : msg.contentType === 'flashcards' && msg.contentData ? (
                            <FlashcardView data={msg.contentData} />
                        ) : msg.contentType === 'practice' && msg.contentData ? (
                            <PracticeProblemsView data={msg.contentData} />
                        ) : msg.role === 'user' ? (
                          <p className="text-[15px] md:text-[16px] leading-relaxed font-medium">{msg.text}</p>
                        ) : (
                          <MarkdownRenderer content={msg.text} />
                        )}
                    </div>

                    {/* Subtle shine effect for user messages */}
                    {msg.role === 'user' && (
                       <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 blur-3xl rounded-full pointer-events-none"></div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                 <div className="flex items-center gap-3 pl-14 animate-fade-in">
                    <div className="flex gap-1.5 p-4 rounded-2xl glass-panel">
                       <div className="w-2 h-2 bg-indigo-500 rounded-full typing-dot"></div>
                       <div className="w-2 h-2 bg-indigo-500 rounded-full typing-dot"></div>
                       <div className="w-2 h-2 bg-indigo-500 rounded-full typing-dot"></div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>
        </div>

        {/* --- Floating Input Area --- */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20 pointer-events-none">
           <div className="max-w-3xl mx-auto pointer-events-auto">
              
              {/* Suggestion Chips */}
              {messages.length < 3 && (
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide justify-center mask-fade-sides">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setInputText(s)}
                      className="whitespace-nowrap px-4 py-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/40 dark:border-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105 transition-all shadow-sm flex items-center gap-2 animate-slide-up"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <Sparkles size={12} className="text-indigo-400"/>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Capsule */}
              <div className="relative group">
                 {/* Input Glow */}
                 <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full opacity-0 group-focus-within:opacity-20 blur-lg transition-opacity duration-500"></div>
                 
                 <div className="relative flex items-end gap-2 glass-panel rounded-[2rem] p-2 pl-5 transition-all shadow-2xl shadow-indigo-500/10">
                    
                    {/* Attachment Preview */}
                    {inputImage && (
                        <div className="absolute -top-24 left-0 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-white/20 animate-slide-up">
                            <img src={inputImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                            <button onClick={() => setInputImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110"><X size={12} /></button>
                        </div>
                    )}

                    {/* Tools */}
                    <div className="flex items-center gap-1 mb-1">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                      >
                        <ImageIcon size={20} />
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </button>
                      <button className="hidden sm:block p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors">
                        <Mic size={20} />
                      </button>
                      <button className="hidden sm:block p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors">
                        <Camera size={20} />
                      </button>
                    </div>

                    {/* Text Area */}
                    <div className="flex-1 py-3">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={inputImage ? "Ask about this image..." : "Ask LearnBro anything..."}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none max-h-32 min-h-[24px] scrollbar-hide text-[16px] font-medium"
                            rows={1}
                            style={{ height: 'auto' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                            }}
                        />
                    </div>

                    {/* Send Button */}
                    <button 
                        onClick={handleSendMessage}
                        disabled={(!inputText.trim() && !inputImage) || isLoading}
                        className={`
                            p-3 rounded-full mb-0.5 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95
                            ${(!inputText.trim() && !inputImage) || isLoading
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30'
                            }
                        `}
                    >
                        <Rocket size={20} className={(!inputText.trim() && !inputImage) || isLoading ? "" : "ml-0.5"} />
                    </button>
                 </div>
              </div>
              
              <p className="text-center text-[10px] font-semibold tracking-wide text-slate-400 mt-4 opacity-70">
                 AI can make mistakes. Check important info.
              </p>
           </div>
        </div>

      </main>
    </div>
  );
}

export default App;