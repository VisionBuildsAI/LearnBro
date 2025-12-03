import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm md:prose-base max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-slate-800 prose-li:my-0.5 prose-strong:text-indigo-700">
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <div className="relative group my-4 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <div className="bg-slate-800 text-slate-400 px-4 py-1.5 text-xs flex justify-between items-center border-b border-slate-700">
                    <span className="font-mono">{match[1]}</span>
                </div>
                <div className="bg-slate-900 text-slate-100 p-4 overflow-x-auto">
                    <code className={`${className} font-mono text-sm`} {...props}>
                    {children}
                    </code>
                </div>
              </div>
            ) : (
              <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-mono text-xs border border-slate-200" {...props}>
                {children}
              </code>
            );
          },
          ul: ({ children }) => <ul className="list-disc ml-5 my-2 space-y-1 marker:text-indigo-400">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-5 my-2 space-y-1 marker:text-indigo-500 marker:font-bold">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-400 pl-4 py-2 my-3 bg-indigo-50/50 italic text-slate-700 rounded-r-lg">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2 text-slate-800 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-6 before:bg-indigo-500 before:rounded-full before:mr-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-3 mb-1 text-slate-800">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;