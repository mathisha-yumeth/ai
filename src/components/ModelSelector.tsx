import React, { useState } from 'react';
import { ChevronDown, Sliders, Cpu, Server, Check, Sparkles, Zap } from 'lucide-react';
import { LocalModelOption, ModelProvider } from '../types/chat';
import { DEFAULT_LOCAL_MODELS } from '../services/modelsRegistry';

interface ModelSelectorProps {
  selectedModelId: string;
  selectedProvider: ModelProvider;
  availableModels: LocalModelOption[];
  onSelectModel: (model: LocalModelOption) => void;
  temperature: number;
  topP: number;
  systemPrompt: string;
  onChangeTemperature: (val: number) => void;
  onChangeTopP: (val: number) => void;
  onChangeSystemPrompt: (val: string) => void;
  onOpenSettings: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  selectedProvider,
  availableModels,
  onSelectModel,
  temperature,
  topP,
  systemPrompt,
  onChangeTemperature,
  onChangeTopP,
  onChangeSystemPrompt,
  onOpenSettings,
}) => {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isOpenParams, setIsOpenParams] = useState(false);

  const currentModel =
    availableModels.find((m) => m.id === selectedModelId) ||
    DEFAULT_LOCAL_MODELS.find((m) => m.id === selectedModelId) ||
    DEFAULT_LOCAL_MODELS[0];

  const getProviderIcon = (provider: ModelProvider) => {
    switch (provider) {
      case 'ollama':
        return <Server className="w-3.5 h-3.5 text-cyan-400" />;
      case 'lmstudio':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'webgpu':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getProviderBadge = (provider: ModelProvider) => {
    switch (provider) {
      case 'ollama':
        return 'Ollama';
      case 'lmstudio':
        return 'LM Studio';
      case 'webgpu':
        return 'WebGPU';
      default:
        return 'Offline Engine';
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Model Dropdown Trigger */}
      <button
        onClick={() => {
          setIsOpenDropdown(!isOpenDropdown);
          setIsOpenParams(false);
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-white font-medium shadow-sm transition-all active:scale-98"
      >
        {getProviderIcon(currentModel.provider)}
        <span className="truncate max-w-[140px] sm:max-w-[200px]">{currentModel.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono hidden sm:inline">
          {getProviderBadge(currentModel.provider)}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Model Parameter Controls Trigger */}
      <button
        onClick={() => {
          setIsOpenParams(!isOpenParams);
          setIsOpenDropdown(false);
        }}
        className={`p-1.5 rounded-xl border transition-all ${
          isOpenParams
            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
        }`}
        title="Model Parameters (Temperature, System Prompt)"
      >
        <Sliders className="w-4 h-4" />
      </button>

      {/* Model Dropdown Menu */}
      {isOpenDropdown && (
        <div className="absolute top-10 left-0 z-30 w-80 max-h-96 overflow-y-auto rounded-2xl bg-[#0f131c] border border-slate-800 shadow-2xl p-2 text-xs animate-in fade-in">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Select Local Model</span>
            <button
              onClick={() => {
                setIsOpenDropdown(false);
                onOpenSettings();
              }}
              className="text-cyan-400 hover:underline lowercase font-normal"
            >
              Configure endpoints
            </button>
          </div>

          <div className="space-y-1 mt-1">
            {availableModels.map((model) => {
              const isSelected = model.id === currentModel.id;
              return (
                <button
                  key={`${model.provider}-${model.id}`}
                  onClick={() => {
                    onSelectModel(model);
                    setIsOpenDropdown(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="mt-0.5">{getProviderIcon(model.provider)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold truncate text-xs">{model.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>
                    {model.recommendedFor && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {model.recommendedFor}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                      <span>{getProviderBadge(model.provider)}</span>
                      {model.size && <span>• {model.size}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Parameter Popup */}
      {isOpenParams && (
        <div className="absolute top-10 right-0 z-30 w-80 rounded-2xl bg-[#0f131c] border border-slate-800 shadow-2xl p-4 text-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-semibold text-white">Inference Parameters</span>
            <span className="text-[10px] font-mono text-cyan-400">Zero-Key Local</span>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Temperature</span>
              <span className="font-mono text-cyan-400">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Precise / Code</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Top-P Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Top-P (Nucleus)</span>
              <span className="font-mono text-cyan-400">{topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={topP}
              onChange={(e) => onChangeTopP(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* System Prompt Customization */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">System Instructions</label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => onChangeSystemPrompt(e.target.value)}
              placeholder="Custom instructions for this session..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500/80 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsOpenParams(false)}
              className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
