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
  RefreshCw,
  MoreVertical,
  Layers
} from 'lucide-react';
import { TeachingMode, ChatMessage } from './types';
import { sendMessageToLearnBro, generateQuizOrFlashcards } from './services/geminiService';
import MarkdownRenderer from './components/MarkdownRenderer';
import { QuizView, FlashcardView } from './components/StudyTools';

// Predefined suggestion chips
const SUGGESTIONS = [
  "Explain Quantum Physics like I'm 5",
  "Solve this math problem",
  "Give me a revision plan for History",
  "Write a Python script for a calculator"
];

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
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom effect
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

  const handleGenerateStudyTool = async (type: 'quiz' | 'flashcards') => {
    const topic = prompt(`What topic do you want ${type === 'quiz' ? 'a quiz' : 'flashcards'} for?`);
    if (!topic) return;

    setIsSidebarOpen(false);
    setIsLoading(true);

    // Add user message indicating request
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
        id: userMsgId,
        role: 'user',
        text: `Generate ${type} for: ${topic}`,
        timestamp: Date.now()
    }]);

    try {
        const data = await generateQuizOrFlashcards(topic, type);
        
        // Add model response with structured data
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: type === 'quiz' ? `Here is a quick quiz on ${topic}. Good luck!` : `Here are your flashcards for ${topic}. Study up!`,
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
      // Create a placeholder for the streaming response
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
        tempMessages, // Pass history (excluding the temp placeholder)
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        currentMode === mode 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className={`${currentMode === mode ? 'text-white' : 'text-indigo-600'}`}>
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
      {currentMode === mode && <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-800 leading-tight">LearnBro</h1>
                <p className="text-xs text-slate-500 font-medium">AI Study Buddy</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Modes Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Teaching Style</h3>
              <div className="space-y-1">
                <ModeButton mode={TeachingMode.DEFAULT} icon={<Sparkles size={18}/>} label="Best Friend (Default)" />
                <ModeButton mode={TeachingMode.ELI5} icon={<BookOpen size={18}/>} label="Explain Like I'm 5" />
                <ModeButton mode={TeachingMode.COMEDIAN} icon={<Zap size={18}/>} label="Stand-up Comedian" />
                <ModeButton mode={TeachingMode.STRICT_MOM} icon={<MoreVertical size={18}/>} label="Strict Indian Mom" />
                <ModeButton mode={TeachingMode.SENIOR} icon={<GraduationCap size={18}/>} label="Helpful Senior" />
                <ModeButton mode={TeachingMode.LATE_NIGHT} icon={<MoreVertical size={18}/>} label="2AM Talks" />
              </div>
            </div>

            {/* Study Tools Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Study Tools</h3>
              <div className="space-y-1">
                <button 
                    onClick={() => handleGenerateStudyTool('quiz')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
                >
                    <div className="text-indigo-600"><BrainCircuit size={18} /></div>
                    <span className="font-medium text-sm">Quick Quiz</span>
                </button>
                <button 
                    onClick={() => handleGenerateStudyTool('flashcards')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
                >
                    <div className="text-indigo-600"><Layers size={18} /></div>
                    <span className="font-medium text-sm">Create Flashcards</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-4">Actions</h3>
              <button 
                onClick={clearChat}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} />
                <span className="font-medium text-sm">Clear History</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-200">
             <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-xs text-indigo-800 font-semibold mb-1">💡 Pro Tip</p>
                <p className="text-xs text-indigo-600 leading-relaxed">
                   Upload a photo of your homework and ask me to explain the logic step-by-step!
                </p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="md:hidden font-bold text-slate-800">LearnBro</div>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {currentMode}
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide bg-slate-50/50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[85%] md:max-w-[70%] rounded-2xl p-4 md:p-6 shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}
                `}
              >
                {msg.image && (
                  <div className="mb-4">
                    <img 
                      src={msg.image} 
                      alt="User upload" 
                      className="max-h-64 rounded-lg border border-white/20 object-contain"
                    />
                  </div>
                )}
                
                {/* Content Rendering Logic */}
                <div className={`${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                  {msg.contentType === 'quiz' && msg.contentData ? (
                      <QuizView data={msg.contentData} />
                  ) : msg.contentType === 'flashcards' && msg.contentData ? (
                      <FlashcardView data={msg.contentData} />
                  ) : msg.role === 'user' ? (
                     <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1].role === 'user' && (
             <div className="flex justify-start">
               <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                 <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot"></div>
                 <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot"></div>
                 <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-100">
          
          {/* Suggestions (only if chat is empty-ish) */}
          {messages.length < 3 && (
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInputText(s)}
                  className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Image Preview */}
          {inputImage && (
             <div className="relative inline-block mb-3">
               <img src={inputImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
               <button 
                 onClick={() => setInputImage(null)}
                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
               >
                 <X size={12} />
               </button>
             </div>
          )}

          <div className="max-w-4xl mx-auto flex items-end gap-3">
            {/* File Upload Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Upload Image"
            >
              <ImageIcon size={24} />
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputImage ? "Add a question about this image..." : "Ask me anything..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none max-h-32 min-h-[50px] scrollbar-hide"
                rows={1}
                style={{ height: 'auto', minHeight: '52px' }}
              />
            </div>

            {/* Send Button */}
            <button 
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && !inputImage) || isLoading}
              className={`
                p-3 rounded-full shadow-lg transition-all transform
                ${(!inputText.trim() && !inputImage) || isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'
                }
              `}
            >
              {isLoading ? <RefreshCw size={24} className="animate-spin" /> : <Send size={24} />}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            LearnBro can make mistakes. Double check exam answers.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;