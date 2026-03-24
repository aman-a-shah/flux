"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AlertCircle, Lightbulb, Code2, BookOpen } from "lucide-react";

export function NotesDisplay({ content }: { content: string }) {
  const cleanedContent = useMemo(() => {
    if (!content) return '';
    return content
      .split('\n')
      .filter((line) => {
        const separatorLine = /^\s*([\-_~=*\u2013\u2014\u2500\u2501]+\s*)+$/; // dash/underscore/tilde/stars/box-drawing
        return !separatorLine.test(line);
      })
      .join('\n')
      .replace(/^[\s\t\n]+|[\s\t\n]+$/g, '');
  }, [content]);

  return (
    <div className="prose prose-zinc max-w-none">
      <style jsx>{`
        /* Typography and spacing */
        :global(.notes-content) {
          color: #27272a;
          line-height: 1.8;
        }

        :global(.notes-content h1) {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        :global(.notes-content h2) {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.8rem;
          margin-bottom: 1rem;
          padding-left: 0.75rem;
          border-left: 4px solid #4f46e5;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        :global(.notes-content h3) {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        :global(.notes-content h4) {
          font-size: 1.1rem;
          font-weight: 600;
          color: #4f46e5;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        /* Paragraphs */
        :global(.notes-content p) {
          margin-bottom: 1rem;
          color: #3f3f46;
        }

        /* Lists */
        :global(.notes-content ul),
        :global(.notes-content ol) {
          margin-bottom: 1.5rem;
          padding-left: 2rem;
        }

        :global(.notes-content li) {
          margin-bottom: 0.5rem;
          color: #3f3f46;
        }

        :global(.notes-content ul > li:before) {
          content: "▸";
          color: #4f46e5;
          font-weight: 600;
          margin-right: 0.75rem;
          margin-left: -1.5rem;
        }

        /* Blockquotes */
        :global(.notes-content blockquote) {
          border-left: 4px solid #4f46e5;
          background: linear-gradient(90deg, rgba(79, 70, 229, 0.05) 0%, transparent 100%);
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          border-radius: 8px;
          color: #374151;
          font-style: italic;
        }

        /* Tables */
        :global(.notes-content table) {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin: 1.5rem 0;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        :global(.notes-content thead) {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }

        :global(.notes-content th) {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: white;
          border-bottom: 2px solid #4f46e5;
          font-size: 0.95rem;
        }

        :global(.notes-content td) {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          color: #3f3f46;
        }

        :global(.notes-content tbody tr:hover) {
          background: #f9fafb;
        }

        :global(.notes-content tbody tr:last-child td) {
          border-bottom: none;
        }

        /* Emphasis */
        :global(.notes-content strong) {
          font-weight: 700;
          color: #1f2937;
        }

        :global(.notes-content em) {
          color: #7c3aed;
          font-style: italic;
        }

        /* Horizontal rule */
        :global(.notes-content hr) {
          border: none;
          height: 2px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 2rem 0;
        }

        /* Links */
        :global(.notes-content a) {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 2px solid rgba(79, 70, 229, 0.3);
          transition: all 0.2s ease;
        }

        :global(.notes-content a:hover) {
          color: #7c3aed;
          border-bottom-color: #7c3aed;
        }

        /* Special callout styling */
        :global(.notes-content blockquote p) {
          margin: 0;
          color: inherit;
        }
      `}</style>

      <div className="notes-content bg-gradient-to-br from-white via-white to-indigo-50/30 rounded-[24px] border border-zinc-200 p-8 shadow-sm">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="flex items-center gap-2" {...props}>
                <BookOpen className="w-7 h-7 text-indigo-500" />
                {props.children}
              </h1>
            ),
            h2: ({ node, ...props }) => (
              <h2 className="flex items-center gap-2" {...props}>
                {props.children}
              </h2>
            ),
            h3: ({ node, ...props }) => (
              <h3 {...props}>{props.children}</h3>
            ),
            code: ({ node, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;

              const sanitizeCode = (text: string) => {
                return text
                  .split('\n')
                  .filter((line) => {
                    const stripped = line.trim();
                    const separator = /^([\-_=~*\u2013\u2014\u2500\u2501]+\s*)+$/;
                    return !separator.test(stripped);
                  })
                  .join('\n')
                  .replace(/^[\s\t\n]+|[\s\t\n]+$/g, '');
              };

              const codeText = sanitizeCode(String(children));

              return !isInline && match ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                  }}
                  {...props}
                >
                  {codeText}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-md font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ node, ...props }) => (
              <div className="relative group bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4 my-6 shadow-lg overflow-x-auto">
                {props.children}
              </div>
            ),
            blockquote: ({ node, ...props }) => (
              <div className="flex gap-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 my-4">
                <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <blockquote className="flex-1" {...props}>
                  {props.children}
                </blockquote>
              </div>
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="text-white font-bold px-4 py-3 text-left border-0" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-4 py-3 border-b border-zinc-200 text-zinc-700" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="hover:bg-indigo-50/50 transition-colors" {...props} />
            ),
          }}
        >
          {cleanedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
