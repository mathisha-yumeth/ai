import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Lock,
  Menu,
  ShieldCheck,
  Cpu,
  Server,
  ArrowUp,
} from 'lucide-react';
import { ChatMessage, Conversation, LocalModelOption, ModelProvider } from '../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ModelSelector } from './ModelSelector';
import { useAuth } from '../context/AuthContext';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  selectedModelId: string;
  selectedProvider: ModelProvider;
  availableModels: LocalModelOption[];
  temperature: number;
  topP: number;
  systemPrompt: string;
  onSendMessage: (content: string) => Promise<void>;
  onStopStreaming: () => void;
  onRegenerate: () => Promise<void>;
  onSelectModel: (model: LocalModelOption) => void;
  onChangeTemperature: (val: number) => void;
  onChangeTopP: (val: number) => void;
  onChangeSystemPrompt: (val: string) => void;
  onOpenSettings: () => void;
  onOpenSidebarMobile: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  isStreaming,
  streamingContent,
  selectedModelId,
  selectedProvider,
  availableModels,
  temperature,
  topP,
  systemPrompt,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onSelectModel,
  onChangeTemperature,
  onChangeTopP,
  onChangeSystemPrompt,
  onOpenSettings,
  onOpenSidebarMobile,
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages or streaming content changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Auto-resize input textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const starterPrompts = [
    {
      title: 'Prove $\\sqrt{2}$ is irrational',
      desc: 'Deep reasoning proof with mathematical step-by-step logic',
      prompt: 'Prove why the square root of 2 is irrational, explaining every step with mathematical rigor.',
    },
    {
      title: 'Design an LRU Cache in TypeScript',
      desc: 'Production-ready O(1) cache with generic keys and values',
      prompt: 'Write a high-performance Least Recently Used (LRU) Cache in TypeScript with O(1) get and put operations.',
    },
    {
      title: 'Sci-fi Clockwork Observatory',
      desc: 'Immersive fiction worldbuilding and dialogue',
      prompt: 'Write a gripping opening scene set in an antique mountain observatory powered by clockwork stars.',
    },
    {
      title: 'Local LLMs vs Cloud AI Privacy',
      desc: 'Security threat modeling and zero-key computing',
      prompt: 'How does running local LLMs compare to cloud APIs in terms of threat modeling, data leakage, and GitHub Pages?',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07090e] relative overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between bg-[#0b0e14]/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebarMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
            title="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <ModelSelector
            selectedModelId={selectedModelId}
            selectedProvider={selectedProvider}
            availableModels={availableModels}
            onSelectModel={onSelectModel}
            temperature={temperature}
            topP={topP}
            systemPrompt={systemPrompt}
            onChangeTemperature={onChangeTemperature}
            onChangeTopP={onChangeTopP}
            onChangeSystemPrompt={onChangeSystemPrompt}
            onOpenSettings={onOpenSettings}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local Engine Active</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Local Runner Settings"
          >
            <Cpu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            /* Empty State Hero */
            <div className="py-8 space-y-8 animate-in fade-in duration-300">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-purple-500/20 border border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-500/10 mb-2">
                  <Bot className="w-10 h-10" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Private Local AI Chat
                </h1>
                <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Run high-capability language models locally in your browser with WebGPU, or connect directly to your local Ollama / LM Studio. 100% private, free, and zero API keys.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Zero API Keys Required
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-300">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    In-Browser WebGPU & Offline
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-purple-300">
                    <Server className="w-3.5 h-3.5 text-purple-400" />
                    Ollama & LM Studio Bridge
                  </span>
                </div>
              </div>

              {/* Starter Question Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {starterPrompts.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(starter.prompt)}
                    className="p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 text-left transition-all duration-200 group hover:shadow-lg hover:shadow-cyan-500/5"
                  >
                    <div className="font-semibold text-slate-200 text-xs group-hover:text-cyan-300 flex items-center justify-between mb-1">
                      <span>{starter.title}</span>
                      <ArrowUp className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 rotate-45 transition-transform" />
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">{starter.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Message Thread */
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-sm ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/10 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-tr-none'
                        : 'bg-[#0f141f] border border-slate-800/90 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    {/* Metadata & Actions for Assistant */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50 text-[11px] text-slate-500 font-mono">
                        <div className="flex items-center gap-2">
                          {msg.modelUsed && (
                            <span className="text-cyan-400/80">{msg.modelUsed}</span>
                          )}
                          {msg.tokensUsed !== undefined && (
                            <span>• {msg.tokensUsed} tokens</span>
                          )}
                          {msg.durationMs !== undefined && (
                            <span>• {(msg.durationMs / 1000).toFixed(1)}s</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="p-1 rounded hover:bg-slate-800 hover:text-slate-300 transition-colors"
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Real-time Streaming Response Bubble */}
              {isStreaming && (
                <div className="flex gap-3 text-sm justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/10 mt-0.5">
                    <Bot className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 bg-[#0f141f] border border-cyan-500/30 text-slate-200 rounded-tl-none shadow-lg">
                    {streamingContent ? (
                      <MarkdownRenderer content={streamingContent} />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        Initializing local LLM inference...
                      </div>
                    )}
                    <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-middle" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar Area */}
      <footer className="p-4 bg-[#0b0e14]/90 border-t border-slate-800/80">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="relative flex items-end rounded-2xl bg-[#111622] border border-slate-800 focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all p-2 shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (runs locally on your device with zero API keys)..."
              className="flex-1 bg-transparent px-2.5 py-1.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed max-h-44 font-normal"
            />

            <div className="flex items-center gap-1.5 pl-2 pb-0.5">
              {isStreaming ? (
                <button
                  onClick={onStopStreaming}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all active:scale-95"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!inputText.trim()}
                  className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-40 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>100% Private local inference • Free &amp; Open Source</span>
            </div>
            <div className="hidden sm:inline">
              Shift + Enter for new line • Enter to send
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
