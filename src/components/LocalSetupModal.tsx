import React, { useState } from 'react';
import { X, Check, RefreshCw, Cpu, Server, AlertCircle, Terminal, HelpCircle, CheckCircle2 } from 'lucide-react';
import { checkOllamaConnection, checkLmStudioConnection, checkWebGpuSupport } from '../services/localAiEngine';
import { ProviderConfig } from '../types/chat';

interface LocalSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProviderConfig;
  onSaveConfig: (newConfig: ProviderConfig) => void;
  onModelListDiscovered?: (provider: 'ollama' | 'lmstudio', models: string[]) => void;
}

export const LocalSetupModal: React.FC<LocalSetupModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onModelListDiscovered,
}) => {
  const [ollamaUrl, setOllamaUrl] = useState(config.ollamaUrl);
  const [lmStudioUrl, setLmStudioUrl] = useState(config.lmStudioUrl);

  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ ok?: boolean; error?: string; models?: string[] } | null>(null);

  const [testingLmStudio, setTestingLmStudio] = useState(false);
  const [lmStudioStatus, setLmStudioStatus] = useState<{ ok?: boolean; error?: string; models?: string[] } | null>(null);

  const [webGpuStatus, setWebGpuStatus] = useState<{ tested: boolean; supported?: boolean }>({ tested: false });

  if (!isOpen) return null;

  const handleTestOllama = async () => {
    setTestingOllama(true);
    setOllamaStatus(null);
    const res = await checkOllamaConnection(ollamaUrl);
    setOllamaStatus(res);
    setTestingOllama(false);
    if (res.ok && onModelListDiscovered) {
      onModelListDiscovered('ollama', res.models);
    }
  };

  const handleTestLmStudio = async () => {
    setTestingLmStudio(true);
    setLmStudioStatus(null);
    const res = await checkLmStudioConnection(lmStudioUrl);
    setLmStudioStatus(res);
    setTestingLmStudio(false);
    if (res.ok && onModelListDiscovered) {
      onModelListDiscovered('lmstudio', res.models);
    }
  };

  const handleTestWebGpu = async () => {
    const res = await checkWebGpuSupport();
    setWebGpuStatus({ tested: true, supported: res.supported });
  };

  const handleSave = () => {
    onSaveConfig({
      ...config,
      ollamaUrl,
      lmStudioUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#111622] to-[#0a0d14] border border-cyan-500/20 shadow-2xl p-6 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Local AI Runner Configuration</h2>
            <p className="text-xs text-slate-400">
              Connect to your local Ollama, LM Studio, or browser WebGPU runtime with zero API keys
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs">
          {/* Section 1: Ollama */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2 text-sm">
                <Server className="w-4 h-4 text-cyan-400" />
                Ollama Engine (Localhost)
              </span>
              <button
                onClick={handleTestOllama}
                disabled={testingOllama}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all font-mono text-[11px] disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testingOllama ? 'animate-spin' : ''}`} />
                {testingOllama ? 'Pinging...' : 'Test Connection'}
              </button>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Ollama API URL:</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {ollamaStatus && (
              <div
                className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                  ollamaStatus.ok
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}
              >
                {ollamaStatus.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {ollamaStatus.ok
                      ? `Connected to Ollama! Found ${ollamaStatus.models?.length || 0} installed models.`
                      : 'Connection Failed'}
                  </div>
                  {ollamaStatus.models && ollamaStatus.models.length > 0 && (
                    <div className="mt-1 font-mono text-[11px] text-slate-300">
                      Models: {ollamaStatus.models.join(', ')}
                    </div>
                  )}
                  {ollamaStatus.error && <div className="mt-1 text-[11px]">{ollamaStatus.error}</div>}
                </div>
              </div>
            )}

            {/* Quick CORS Help */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Need Browser CORS for Ollama?</span>
              </div>
              <p className="text-[11px]">Run Ollama with origins enabled so browser tabs can connect directly:</p>
              <div className="p-1.5 rounded bg-black font-mono text-cyan-300 text-[11px] select-all">
                OLLAMA_ORIGINS=&quot;*&quot; ollama serve
              </div>
            </div>
          </div>

          {/* Section 2: LM Studio */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2 text-sm">
                <Cpu className="w-4 h-4 text-purple-400" />
                LM Studio / OpenAI-Compatible Local Endpoint
              </span>
              <button
                onClick={handleTestLmStudio}
                disabled={testingLmStudio}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all font-mono text-[11px] disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testingLmStudio ? 'animate-spin' : ''}`} />
                {testingLmStudio ? 'Pinging...' : 'Test Connection'}
              </button>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">LM Studio API URL:</label>
              <input
                type="text"
                value={lmStudioUrl}
                onChange={(e) => setLmStudioUrl(e.target.value)}
                placeholder="http://localhost:1234/v1"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 font-mono text-purple-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            {lmStudioStatus && (
              <div
                className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                  lmStudioStatus.ok
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}
              >
                {lmStudioStatus.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {lmStudioStatus.ok ? 'Connected to LM Studio Server!' : 'Connection Failed'}
                  </div>
                  {lmStudioStatus.models && (
                    <div className="mt-1 font-mono text-[11px] text-slate-300">
                      Loaded Model: {lmStudioStatus.models.join(', ')}
                    </div>
                  )}
                  {lmStudioStatus.error && <div className="mt-1 text-[11px]">{lmStudioStatus.error}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Browser WebGPU & Offline Client */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                In-Browser WebGPU & Offline Neural Engine
              </span>
              <button
                onClick={handleTestWebGpu}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-mono text-[11px]"
              >
                Check WebGPU
              </button>
            </div>
            <p className="text-slate-400 text-xs">
              When WebGPU is active, models run directly in your browser tab using GPU shaders. If WebGPU is not supported, our lightweight offline neural engine executes client-side seamlessly.
            </p>
            {webGpuStatus.tested && (
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {webGpuStatus.supported
                    ? 'WebGPU Hardware Acceleration is available in this browser!'
                    : 'WebGPU not detected. Offline Neural Engine fallback active.'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
