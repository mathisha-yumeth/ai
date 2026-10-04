import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Check, ArrowRight } from 'lucide-react';
import { PromptPreset } from '../types/chat';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PromptPreset[];
  onSelectPreset: (preset: PromptPreset) => void;
  onCreatePreset: (preset: Omit<PromptPreset, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onDeletePreset: (presetId: string) => Promise<void>;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSelectPreset,
  onCreatePreset,
  onDeletePreset,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [initialUserMessage, setInitialUserMessage] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !systemPrompt.trim()) return;

    setSaving(true);
    try {
      await onCreatePreset({
        title: title.trim(),
        category: category.trim(),
        systemPrompt: systemPrompt.trim(),
        initialUserMessage: initialUserMessage.trim() || undefined,
      });
      setTitle('');
      setSystemPrompt('');
      setInitialUserMessage('');
      setActiveTab('browse');
    } catch (err) {
      console.error('Failed creating preset:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#111622] to-[#0a0d14] border border-cyan-500/20 shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Prompt & Persona Library</h2>
              <p className="text-xs text-slate-400">
                Switch personas or configure system instructions for local models
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('browse')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'browse'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Explore Personas ({presets.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Custom Persona
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'browse' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="group relative flex flex-col justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                        {preset.title}
                      </span>
                      {preset.category && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                          {preset.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
                      {preset.systemPrompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <button
                      onClick={() => onDeletePreset(preset.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                      title="Delete persona"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectPreset(preset);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-medium text-xs"
                    >
                      Use Persona
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Persona Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Rust Architect, Socrates, LaTeX Formatter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="General">General</option>
                  <option value="Coding">Coding & Software</option>
                  <option value="Reasoning">Reasoning & Math</option>
                  <option value="Creative">Creative Writing</option>
                  <option value="Security">Security & Privacy</option>
                  <option value="Productivity">Productivity</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">System Instructions</label>
                <textarea
                  required
                  rows={4}
                  placeholder="You are an expert... You always format your response with..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Initial Starter Message <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Can you review this code snippet?"
                  value={initialUserMessage}
                  onChange={(e) => setInitialUserMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Persona'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
