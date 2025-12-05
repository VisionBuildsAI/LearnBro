import React, { useState } from 'react';
import { X, Save, Download, Check, PenTool } from 'lucide-react';

interface CreateNotesModalProps {
  onClose: () => void;
}

export const CreateNotesModal: React.FC<CreateNotesModalProps> = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);

  const handleExport = () => {
    const element = document.createElement("a");
    const file = new Blob([`# ${title}\n\n${content}`], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_') || 'notes'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSave = () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl h-[80vh] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden bg-slate-900/90 text-slate-100 border border-white/10">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-pink-500/20 text-pink-400 rounded-xl">
                <PenTool size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold font-display tracking-tight">Draft Notes</h2>
                <p className="text-xs text-slate-400 font-medium">Capture your thoughts</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden bg-slate-950/50">
            <input 
                type="text" 
                placeholder="Note Title..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border-b border-white/10 py-3 text-2xl font-bold text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-colors font-display"
            />
            <textarea 
                placeholder="Start typing your notes here..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 bg-transparent rounded-xl p-2 resize-none focus:outline-none text-slate-300 placeholder-slate-700 leading-relaxed scrollbar-hide text-lg"
            />
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-xl flex justify-between items-center">
            <div className="text-xs text-slate-500 font-medium px-2">
                {content.length} chars
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/5 hover:text-white"
                >
                    {saved ? <Check size={14} className="text-green-400"/> : <Save size={14} />}
                    {saved ? 'Saved' : 'Save'}
                </button>
                <button 
                    onClick={handleExport}
                    disabled={!title && !content}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-colors shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={14} />
                    Export
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};