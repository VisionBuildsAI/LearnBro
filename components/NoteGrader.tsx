import React, { useRef, useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Download, X, Highlighter, ArrowRight } from 'lucide-react';
import { NoteCorrectionData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface NoteGraderProps {
  data: NoteCorrectionData;
}

declare const html2pdf: any;

export const NoteGraderView: React.FC<NoteGraderProps> = ({ data }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const downloadPdf = async () => {
    if (!contentRef.current || typeof html2pdf === 'undefined') {
        alert("PDF generation library not loaded or content missing.");
        return;
    }

    setIsGeneratingPdf(true);
    const element = contentRef.current;
    
    // Configuration for html2pdf
    const opt = {
      margin:       [0.5, 0.5],
      filename:     `${data.title.replace(/\s+/g, '_')}_Corrected_Notes.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (e) {
        console.error("PDF Export failed", e);
        alert("Could not generate PDF.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full space-y-6">
       
       {/* Actions Bar */}
       <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
               <Highlighter size={20} />
             </div>
             <div>
               <h3 className="font-bold text-slate-800">Grade & Fix</h3>
               <p className="text-xs text-slate-500">AI Professor Review</p>
             </div>
          </div>
          <button 
            onClick={downloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            <Download size={14} />
          </button>
       </div>

       {/* Printable Content Area */}
       <div ref={contentRef} className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm print-container">
          
          {/* Header for PDF */}
          <div className="mb-8 border-b-2 border-slate-900 pb-4">
             <h1 className="text-3xl font-bold text-slate-900 mb-2">{data.title}</h1>
             <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Corrected Study Notes • LearnBro AI</p>
          </div>

          {/* Analysis Section */}
          {data.analysis && data.analysis.length > 0 && (
            <div className="mb-8">
               <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <AlertTriangle size={16} /> Analysis & Corrections
               </h4>
               <div className="space-y-3">
                  {data.analysis.map((item, idx) => (
                    <div key={idx} className="bg-rose-50/50 border border-rose-100 p-4 rounded-lg text-sm">
                       <div className="flex items-start gap-3 text-rose-800 mb-2 opacity-80 strike-through">
                          <X size={14} className="mt-1 flex-shrink-0" />
                          <span className="line-through decoration-rose-400">{item.point}</span>
                       </div>
                       <div className="flex items-start gap-3 text-emerald-700 font-medium">
                          <ArrowRight size={14} className="mt-1 flex-shrink-0" />
                          <span>{item.correction}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Corrected Content */}
          <div className="mb-8">
             <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={16} /> Final Corrected Notes
             </h4>
             <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700">
                <MarkdownRenderer content={data.correctedNotes} />
             </div>
          </div>

          {/* Diagram */}
          {data.diagramUrl && (
             <div className="break-inside-avoid">
                <h4 className="text-sm font-bold text-cyan-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <CheckCircle2 size={16} /> Visual Aid
                </h4>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                   <img src={data.diagramUrl} alt="Educational Diagram" className="w-full h-auto rounded-lg" />
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">AI Generated Diagram</p>
             </div>
          )}
          
          <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
             <span>Generated by LearnBro</span>
             <span>{new Date().toLocaleDateString()}</span>
          </div>
       </div>

    </div>
  );
};