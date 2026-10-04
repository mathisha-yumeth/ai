import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Download,
  Settings,
  Github,
  Sparkles,
  LogIn,
  LogOut,
  Shield,
  CloudCheck,
  CloudOff,
  Cpu,
  Bot,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { Conversation } from '../types/chat';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onTogglePinConversation: (id: string, isPinned: boolean) => void;
  onExportConversation: (conversation: Conversation) => void;
  onOpenSettings: () => void;
  onOpenPromptLibrary: () => void;
  onOpenGitHubPages: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onTogglePinConversation,
  onExportConversation,
  onOpenSettings,
  onOpenPromptLibrary,
  onOpenGitHubPages,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, signInWithGoogle, signOutUser, isFirebaseConnected } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const recentConversations = filteredConversations.filter((c) => !c.isPinned);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 flex flex-col bg-[#0b0e14] border-r border-slate-800/80 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* App Title Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-sm">AetherLocal</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  Zero-Key
                </span>
              </div>
              <p className="text-[11px] text-slate-400">100% Private Local AI</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Row: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewConversation();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:via-blue-500/20 hover:to-indigo-500/20 border border-cyan-500/30 text-cyan-300 font-medium text-xs transition-all shadow-sm active:scale-98 group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>Start New Chat</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
              +
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 py-2 text-xs">
          {pinnedConversations.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3 text-cyan-400" />
                Pinned
              </div>
              <div className="space-y-1">
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      onCloseMobile();
                    }}
                    onDelete={() => onDeleteConversation(conv.id)}
                    onTogglePin={() => onTogglePinConversation(conv.id, !conv.isPinned)}
                    onExport={() => onExportConversation(conv)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            {pinnedConversations.length > 0 && (
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Recent Chats
              </div>
            )}
            {recentConversations.length === 0 && pinnedConversations.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                No conversations yet. Start typing to create your first private chat!
              </div>
            ) : (
              <div className="space-y-1">
                {recentConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      onCloseMobile();
                    }}
                    onDelete={() => onDeleteConversation(conv.id)}
                    onTogglePin={() => onTogglePinConversation(conv.id, !conv.isPinned)}
                    onExport={() => onExportConversation(conv)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Center & Modals Shortcuts */}
        <div className="p-3 border-t border-slate-800/80 space-y-1 text-xs">
          <button
            onClick={onOpenGitHubPages}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Github className="w-4 h-4 text-slate-400" />
              <span>Deploy to GitHub Pages</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
              Free
            </span>
          </button>

          <button
            onClick={onOpenPromptLibrary}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Prompt & Persona Library</span>
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Local Runner & CORS Setup</span>
            </span>
          </button>
        </div>

        {/* User Account / Google Sign-In Bar */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800/80">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-cyan-500/40 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-500 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {user.email?.slice(0, 1).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Firestore Synced
                  </div>
                </div>
              </div>
              <button
                onClick={signOutUser}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  Local Guest Mode
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Private</span>
              </div>
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all shadow-sm active:scale-98"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

const ConversationItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onExport: () => void;
}> = ({ conversation, isActive, onSelect, onDelete, onTogglePin, onExport }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
        isActive
          ? 'bg-cyan-500/15 border border-cyan-500/30 text-white font-medium'
          : 'text-slate-300 hover:text-white hover:bg-slate-900/60 border border-transparent'
      }`}
    >
      <button
        onClick={onSelect}
        className="flex-1 text-left truncate flex items-center gap-2 pr-1"
      >
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
          }`}
        />
        <span className="truncate text-xs">{conversation.title || 'Untitled Chat'}</span>
      </button>

      {/* Action buttons (Pin, Export, Delete) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={`p-1 rounded hover:bg-slate-800 ${
            conversation.isPinned ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={conversation.isPinned ? 'Unpin' : 'Pin to top'}
        >
          <Pin className="w-3 h-3" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onExport();
          }}
          className="p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-slate-800"
          title="Export as Markdown"
        >
          <Download className="w-3 h-3" />
        </button>

        {showConfirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowConfirmDelete(false);
              }}
              className="text-[10px] px-1 py-0.5 rounded bg-rose-600 text-white font-semibold"
            >
              Del
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDelete(false);
              }}
              className="text-[10px] px-1 py-0.5 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDelete(true);
            }}
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
            title="Delete chat"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
