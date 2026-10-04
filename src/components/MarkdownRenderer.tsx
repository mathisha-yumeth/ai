import React, { useState } from 'react';
import { Check, Copy, ChevronDown, ChevronRight, Brain } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Check for <think>...</think> reasoning blocks
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  let thinkingContent: string | null = null;
  let mainContent = content;

  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  } else if (content.startsWith('<think>')) {
    // Incomplete thinking stream
    const partialThink = content.slice(7);
    thinkingContent = partialThink.trim();
    mainContent = '';
  }

  return (
    <div className="space-y-3 leading-relaxed text-slate-200 text-[14.5px]">
      {thinkingContent && <ThinkingBlock thoughts={thinkingContent} />}
      {mainContent ? (
        <RenderBlocks text={mainContent} />
      ) : thinkingContent ? (
        <div className="text-xs text-slate-400 italic flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Synthesizing thoughts into answer...
        </div>
      ) : null}
    </div>
  );
};

const ThinkingBlock: React.FC<{ thoughts: string }> = ({ thoughts }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-2 border border-cyan-900/40 rounded-xl bg-cyan-950/20 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-900/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reasoning Process ({thoughts.split('\n').length} thoughts)</span>
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-cyan-900/30 bg-black/30 font-mono text-[12px] text-cyan-200/80 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
          {thoughts}
        </div>
      )}
    </div>
  );
};

const RenderBlocks: React.FC<{ text: string }> = ({ text }) => {
  // Split text by code fences: ```lang\ncode\n```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/^```(\w+)?\n([\s\S]*?)```$/);
          const lang = match ? match[1] || 'plaintext' : 'plaintext';
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={index} code={code} language={lang} />;
        }
        return <FormattedParagraphs key={index} text={part} />;
      })}
    </>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.trim().split('\n').length;

  return (
    <div className="my-3 rounded-xl border border-slate-700/60 bg-[#0d1117] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-slate-800 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-2 uppercase font-semibold text-[11px] text-cyan-400 tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-400/80" />
          {language}
          <span className="text-slate-500 font-normal lowercase">({lineCount} lines)</span>
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs active:scale-95"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto font-mono text-[13px] leading-relaxed text-slate-200">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const FormattedParagraphs: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: string[] = [];

  const flushTable = (keyPrefix: number) => {
    if (currentTable.length > 0) {
      elements.push(<RenderTable key={`tbl-${keyPrefix}`} rows={currentTable} />);
      currentTable = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Markdown Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      currentTable.push(trimmed);
      return;
    } else {
      flushTable(idx);
    }

    if (!trimmed) {
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-cyan-400 rounded-full" />
          {parseInlineFormatting(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={idx} className="text-sm font-semibold text-slate-100 mt-3 mb-1.5">
          {parseInlineFormatting(trimmed.slice(5))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-lg font-bold text-white mt-5 mb-2.5">
          {parseInlineFormatting(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-xl font-extrabold text-white mt-5 mb-3">
          {parseInlineFormatting(trimmed.slice(2))}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={idx} className="ml-4 list-disc text-slate-300 my-0.5">
          {parseInlineFormatting(trimmed.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+\.)\s(.*)$/);
      elements.push(
        <div key={idx} className="ml-2 flex items-start gap-2 my-1 text-slate-300">
          <span className="font-mono text-cyan-400 font-semibold text-xs mt-0.5">{numMatch?.[1]}</span>
          <span>{parseInlineFormatting(numMatch?.[2] || '')}</span>
        </div>
      );
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={idx} className="border-l-2 border-cyan-400/80 pl-3.5 py-1 text-slate-300/90 italic bg-cyan-950/10 rounded-r-lg my-2">
          {parseInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
    } else {
      elements.push(
        <p key={idx} className="my-1.5 text-slate-200">
          {parseInlineFormatting(line)}
        </p>
      );
    }
  });

  flushTable(lines.length);

  return <>{elements}</>;
};

const RenderTable: React.FC<{ rows: string[] }> = ({ rows }) => {
  if (rows.length < 2) return null;
  const parseRow = (row: string) =>
    row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

  const headers = parseRow(rows[0]);
  const dataRows = rows.slice(2).map(parseRow);

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/50">
      <table className="min-w-full divide-y divide-slate-800 text-xs">
        <thead className="bg-slate-800/60">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2 text-left font-semibold text-cyan-300">
                {parseInlineFormatting(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 text-slate-300 whitespace-nowrap">
                  {parseInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function parseInlineFormatting(str: string): React.ReactNode {
  // Parse inline `code`, **bold**, *italic*, and math $...$
  const tokens = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 font-mono text-[12.5px] text-cyan-300">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={i} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
      return (
        <span key={i} className="font-serif italic text-cyan-300 font-semibold px-0.5">
          {token.slice(1, -1)}
        </span>
      );
    }
    return token;
  });
}
