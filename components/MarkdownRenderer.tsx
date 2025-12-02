import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-li:my-0">
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <div className="bg-slate-800 text-slate-100 rounded-md p-2 my-2 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono text-sm" {...props}>
                {children}
              </code>
            );
          },
          ul: ({ children }) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-2 bg-indigo-50 italic text-slate-700 rounded-r">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;