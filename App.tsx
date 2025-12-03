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
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { TeachingMode, ChatMessage } from './types';
import { sendMessageToLearnBro, generateStudyMaterial, generateDiagram } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';
import { QuizView, FlashcardView, PracticeProblemsView } from './components/StudyTools';

// Predefined suggestion chips
const SUGGESTIONS = [
  "Explain Quantum Physics like I'm 5",
  "Solve this math problem",
  "Give me a revision plan for History",
  "Write a Python script for a calculator"
];

// --- Input Modal Component ---
const InputModal = ({ isOpen, onClose, title, placeholder, onConfirm }: { isOpen: boolean; onClose: () => void; title: string; placeholder: string; onConfirm: (val: string) => void }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
      if(isOpen) setValue("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200/60 rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-indigo-500/10 scale-100 animate-slide-up relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 relative z-10">What topic should we focus on today?</p>
        
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
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-lg shadow-inner relative z-10"
        />
        <div className="flex justify-end gap-3 relative z-10">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-xl transition-colors"
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
            className="px-7 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Yo! I'm LearnBro. What are we crushing today? Math? Coding? Or just life advice? Let's get it. 🚀",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<TeachingMode>(TeachingMode.DEFAULT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Render Helpers
  const ModeButton = ({ mode, icon, label }: { mode: TeachingMode, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => { setCurrentMode(mode); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden ${
        currentMode === mode 
        ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-200' 
        : 'hover:bg-slate-50 text-slate-600 font-medium'
      }`}
    >
       {currentMode === mode && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-md"></div>}
      <div className={`p-1.5 rounded-lg transition-colors ${currentMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm'}`}>
        {icon}
      </div>
      <span className="text-sm flex-1 text-left">{label}</span>
      {currentMode === mode && <CheckCircle2 size={16} className="text-indigo-600 animate-fade-in" />}
    </button>
  );

  return (
    <div className={`flex h-screen bg-grid-pattern overflow-hidden`}>
      
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
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-80 glass-nav transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 pb-2 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-50 ring-offset-1">
                <BrainCircuit size={22} />
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-800 tracking-tight">LearnBro</h1>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Online</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
            
            {/* Modes Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                 <Sparkles size={12} /> Persona
              </h3>
              <div className="flex flex-col gap-1.5">
                <ModeButton mode={TeachingMode.DEFAULT} icon={<MessageSquare size={18}/>} label="Best Friend" />
                <ModeButton mode={TeachingMode.ELI5} icon={<BookOpen size={18}/>} label="Explain Like I'm 5" />
                <ModeButton mode={TeachingMode.COMEDIAN} icon={<Zap size={18}/>} label="Comedian" />
                <ModeButton mode={TeachingMode.STRICT_MOM} icon={<MoreVertical size={18}/>} label="Strict Mom" />
                <ModeButton mode={TeachingMode.SENIOR} icon={<GraduationCap size={18}/>} label="Senior" />
                <ModeButton mode={TeachingMode.LATE_NIGHT} icon={<Moon size={18}/>} label="2AM Talks" />
              </div>
            </div>

            {/* Study Tools Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                 <Layers size={12} /> Tools
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => handleGenerateStudyTool('quiz')}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 hover:-translate-y-0.5 transition-all text-center group"
                >
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform"><BrainCircuit size={20} /></div>
                    <span className="font-semibold text-xs text-slate-600">Quiz</span>
                </button>
                <button 
                    onClick={() => handleGenerateStudyTool('flashcards')}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100 hover:-translate-y-0.5 transition-all text-center group"
                >
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-full group-hover:scale-110 transition-transform"><Layers size={20} /></div>
                    <span className="font-semibold text-xs text-slate-600">Flashcards</span>
                </button>
                <button 
                    onClick={() => handleGenerateStudyTool('practice')}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100 hover:-translate-y-0.5 transition-all text-center group"
                >
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full group-hover:scale-110 transition-transform"><PenTool size={20} /></div>
                    <span className="font-semibold text-xs text-slate-600">Practice</span>
                </button>
                <button 
                    onClick={handleGenerateDiagram}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 hover:border-pink-300 hover:shadow-md hover:shadow-pink-100 hover:-translate-y-0.5 transition-all text-center group"
                >
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-full group-hover:scale-110 transition-transform"><Palette size={20} /></div>
                    <span className="font-semibold text-xs text-slate-600">Diagram</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <button 
                onClick={clearChat}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left group border border-transparent hover:border-red-100"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                </div>
                <span className="font-medium text-sm">Clear History</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100/50">
             <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-lg shadow-indigo-200 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={60} />
                </div>
                <p className="text-xs font-bold mb-1 flex items-center gap-1 text-indigo-100">
                   <Lightbulb size={12} /> Pro Tip
                </p>
                <p className="text-xs leading-relaxed font-medium opacity-90">
                   Upload a photo of your homework and ask me to explain the logic step-by-step!
                </p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header (Mobile Only) */}
        <header className="md:hidden h-16 glass-panel border-b border-white/50 flex items-center justify-between px-4 z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <div className="font-bold text-slate-800 flex items-center gap-2">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                 <BrainCircuit size={18} />
               </div>
               LearnBro
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-8 space-y-8 scrollbar-hide pb-32">
          {messages.map((msg, index) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Avatar for AI */}
              {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 mr-3 mt-1 shadow-md self-start hidden md:flex">
                      <BrainCircuit size={14} />
                  </div>
              )}

              <div 
                className={`
                  max-w-[90%] md:max-w-[70%] rounded-3xl p-5 md:p-7 shadow-sm relative group
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-indigo-200' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-slate-200/50 hover:shadow-slate-300/50 transition-shadow'}
                `}
              >
                {/* Decorative corner for AI messages */}
                {msg.role === 'model' && (
                    <div className="absolute top-0 left-0 w-3 h-3 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 rounded-br-full"></div>
                )}

                {msg.image && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-white/20 shadow-sm bg-black/5">
                    <img 
                      src={msg.image} 
                      alt={msg.role === 'user' ? "User upload" : "LearnBro generated diagram"}
                      className="max-h-80 w-full object-contain hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                
                {/* Content Rendering Logic */}
                <div className={`${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                  {msg.contentType === 'quiz' && msg.contentData ? (
                      <QuizView data={msg.contentData} />
                  ) : msg.contentType === 'flashcards' && msg.contentData ? (
                      <FlashcardView data={msg.contentData} />
                  ) : msg.contentType === 'practice' && msg.contentData ? (
                      <PracticeProblemsView data={msg.contentData} />
                  ) : msg.role === 'user' ? (
                     <p className="whitespace-pre-wrap leading-relaxed text-[16px] font-medium tracking-wide">{msg.text}</p>
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}
                </div>
                
                {/* Timestamp */}
                <div className={`text-[10px] mt-2 opacity-0 group-hover:opacity-60 transition-opacity absolute bottom-2 right-4 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1].role === 'user' && (
             <div className="flex justify-start animate-fade-in pl-11">
               <div className="bg-white/80 border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-2 w-fit">
                 <span className="text-xs font-semibold text-slate-400 mr-2">Thinking</span>
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full typing-dot"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full typing-dot"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full typing-dot"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent z-10">
          
          <div className="max-w-4xl mx-auto space-y-3">
             {/* Suggestions */}
            {messages.length < 3 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
                {SUGGESTIONS.map((s, i) => (
                    <button
                    key={s}
                    onClick={() => setInputText(s)}
                    className="whitespace-nowrap px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white border border-slate-200/60 rounded-full text-xs font-medium text-slate-600 hover:text-indigo-600 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 animate-slide-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    >
                    <Sparkles size={12} className="text-indigo-400"/>
                    {s}
                    </button>
                ))}
                </div>
            )}

            {/* Input Capsule */}
            <div className="relative flex items-end gap-2 bg-white rounded-[2rem] shadow-glow border border-slate-200/80 p-2 pl-4 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                
                {/* Image Preview */}
                {inputImage && (
                    <div className="absolute bottom-full left-4 mb-2 animate-slide-up">
                        <div className="relative group">
                            <img src={inputImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-lg" />
                            <button 
                                onClick={() => setInputImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors self-center mb-0.5"
                    title="Upload Image"
                >
                    <ImageIcon size={22} />
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                </button>

                <div className="flex-1 py-3">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={inputImage ? "Ask about this image..." : "Ask me anything..."}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-800 placeholder-slate-400 resize-none max-h-32 min-h-[24px] scrollbar-hide text-[16px]"
                        rows={1}
                        style={{ height: 'auto' }} 
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                        }}
                    />
                </div>

                <button 
                    onClick={handleSendMessage}
                    disabled={(!inputText.trim() && !inputImage) || isLoading}
                    className={`
                        p-3 rounded-full mb-0.5 transition-all duration-300 flex items-center justify-center
                        ${(!inputText.trim() && !inputImage) || isLoading
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:scale-110 hover:shadow-indigo-300'
                        }
                    `}
                >
                    <Send size={20} className={(!inputText.trim() && !inputImage) || isLoading ? "" : "ml-0.5"} />
                </button>
            </div>
            
            <div className="text-center">
                <p className="text-[10px] text-slate-400 font-medium">
                LearnBro can make mistakes. Check important info.
                </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;