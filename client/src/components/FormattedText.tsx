import React from 'react';

interface FormattedTextProps {
  content: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Clean LaTeX / math formatting if present
  const cleanedContent = content
    .replace(/\\mathcal\{O\}/g, 'O')
    .replace(/\$\\mathcal\{O\}\((.*?)\)\$/g, 'O($1)')
    .replace(/\$O\((.*?)\)\$/g, 'O($1)')
    .replace(/\$([0-9a-zA-Z\^\*\_\+\-\=\(\)\/ ]+)\$/g, '$1');

  // Split lines
  const lines = cleanedContent.split('\n');

  return (
    <div className={`space-y-2.5 leading-relaxed text-xs ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Horizontal dividers
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return <hr key={lineIdx} className="border-slate-800 my-2.5" />;
        }

        // Major Section Headers (### or ##)
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
          const headerText = trimmed.replace(/^#{1,4}\s*/, '').replace(/\*\*/g, '');
          return (
            <div key={lineIdx} className="pt-3 pb-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/10 border border-blue-500/30 text-blue-300 font-bold text-xs shadow-xs">
                <span>{headerText}</span>
              </div>
            </div>
          );
        }

        // Parameter/Goal Header badges
        if (trimmed.startsWith('📌') || trimmed.startsWith('🎯') || trimmed.startsWith('📥') || trimmed.startsWith('📤') || trimmed.startsWith('💡') || trimmed.startsWith('⚠️') || trimmed.startsWith('🔍') || trimmed.startsWith('🧠')) {
          const cleanText = trimmed.replace(/\*\*/g, '');
          return (
            <div key={lineIdx} className="pt-2 pb-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                {cleanText}
              </span>
            </div>
          );
        }

        // Bullet points (• or * or -)
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.replace(/^([•\-\*]\s*)/, '').trim();
          return (
            <div key={lineIdx} className="flex items-start gap-2 text-slate-300 text-xs pl-2">
              <span className="text-blue-400 font-black mt-0.5">•</span>
              <div className="flex-1 leading-relaxed">{renderInlineMarkdown(bulletContent)}</div>
            </div>
          );
        }

        // Numbered list items (1. 2. etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const text = numMatch[2];
          return (
            <div key={lineIdx} className="flex items-start gap-2 text-slate-300 text-xs pl-2">
              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                {num}
              </span>
              <div className="flex-1 leading-relaxed">{renderInlineMarkdown(text)}</div>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <div key={lineIdx} className="text-slate-300 text-xs leading-relaxed">
            {renderInlineMarkdown(line)}
          </div>
        );
      })}
    </div>
  );
};

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to match **bold**, *italic*, and `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-900 text-blue-300 font-mono text-[11px] border border-slate-700/80 shadow-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="text-slate-300 italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}
