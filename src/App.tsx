/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { GitHubPagesModal } from './components/GitHubPagesModal';
import { LocalSetupModal } from './components/LocalSetupModal';
import { PromptLibraryModal } from './components/PromptLibraryModal';
import {
  Conversation,
  ChatMessage,
  PromptPreset,
  LocalModelOption,
  ModelProvider,
  ProviderConfig,
} from './types/chat';
import { DEFAULT_LOCAL_MODELS, PRESET_PROMPTS } from './services/modelsRegistry';
import { streamChatCompletion } from './services/localAiEngine';
import {
  subscribeToConversations,
  subscribeToMessages,
  createConversation,
  updateConversation,
  deleteConversation,
  addChatMessage,
  subscribeToPromptPresets,
  createPromptPreset,
  deletePromptPreset,
} from './firebase/services';

const LOCAL_STORAGE_CONVERSATIONS_KEY = 'aether_local_conversations';
const LOCAL_STORAGE_MESSAGES_KEY = 'aether_local_messages_';
const LOCAL_STORAGE_PRESETS_KEY = 'aether_local_presets';
const LOCAL_STORAGE_CONFIG_KEY = 'aether_local_provider_config';

function MainApp() {
  const { user } = useAuth();

  // Navigation & Modals
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Provider & Model Config
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234/v1',
      webGpuModelId: 'smollm2-360m-instruct',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4096,
    };
  });

  const [availableModels, setAvailableModels] = useState<LocalModelOption[]>(DEFAULT_LOCAL_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_LOCAL_MODELS[0].id);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(DEFAULT_LOCAL_MODELS[0].provider);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are AetherLocal, an exceptionally capable, private local AI assistant running directly on device. Answer questions accurately with clean formatting.'
  );

  // Conversations & Messages State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Presets
  const [presets, setPresets] = useState<PromptPreset[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return PRESET_PROMPTS.map((p) => ({
      ...p,
      userId: 'local',
      createdAt: new Date().toISOString(),
    }));
  });

  // Save config to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(providerConfig));
  }, [providerConfig]);

  // Handle Firebase Realtime Subscriptions when logged in
  useEffect(() => {
    if (!user) {
      // Load local guest conversations
      const saved = localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setConversations(parsed);
          if (parsed.length > 0 && !activeConversationId) {
            setActiveConversationId(parsed[0].id);
          }
        } catch {}
      }
      return;
    }

    // Authenticated Firestore Subscriptions
    const unsubConversations = subscribeToConversations(user.uid, (cloudConversations) => {
      setConversations(cloudConversations);
      if (cloudConversations.length > 0 && !activeConversationId) {
        setActiveConversationId(cloudConversations[0].id);
      }
    });

    const unsubPresets = subscribeToPromptPresets(user.uid, (cloudPresets) => {
      if (cloudPresets.length > 0) {
        // Merge cloud custom presets with system defaults
        const defaults = PRESET_PROMPTS.map((p) => ({
          ...p,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        }));
        setPresets([...cloudPresets, ...defaults]);
      }
    });

    return () => {
      unsubConversations();
      unsubPresets();
    };
  }, [user]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    if (user) {
      const unsub = subscribeToMessages(user.uid, activeConversationId, (cloudMsgs) => {
        setMessages(cloudMsgs);
      });
      return () => unsub();
    } else {
      // LocalStorage for guest
      const saved = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY + activeConversationId);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [activeConversationId, user]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // New Conversation
  const handleNewConversation = async () => {
    const newId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      userId: user ? user.uid : 'guest',
      title: 'New Chat',
      provider: selectedProvider,
      model: selectedModelId,
      systemPrompt: systemPrompt,
      temperature: providerConfig.temperature,
      topP: providerConfig.topP,
      isPinned: false,
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (user) {
      await createConversation(user.uid, newConv);
    } else {
      const updated = [newConv, ...conversations];
      setConversations(updated);
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated));
    }
    setActiveConversationId(newId);
    setMessages([]);
  };

  // Delete Conversation
  const handleDeleteConversation = async (convId: string) => {
    if (user) {
      await deleteConversation(user.uid, convId);
    } else {
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated));
      localStorage.removeItem(LOCAL_STORAGE_MESSAGES_KEY + convId);
    }

    if (activeConversationId === convId) {
      const remaining = conversations.filter((c) => c.id !== convId);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (convId: string, isPinned: boolean) => {
    if (user) {
      await updateConversation(user.uid, convId, { isPinned });
    } else {
      const updated = conversations.map((c) => (c.id === convId ? { ...c, isPinned } : c));
      setConversations(updated);
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated));
    }
  };

  // Export Conversation to Markdown
  const handleExportConversation = (conv: Conversation) => {
    let md = `# ${conv.title}\n\n`;
    md += `* **Model:** ${conv.model} (${conv.provider})\n`;
    md += `* **Exported Date:** ${new Date().toLocaleString()}\n`;
    md += `* **System Prompt:** ${conv.systemPrompt || 'Default'}\n\n---\n\n`;

    messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'User' : 'Assistant'}\n\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send Message & Stream Response
  const handleSendMessage = async (text: string) => {
    let currentConvId = activeConversationId;
    let currentConv = activeConversation;

    // Create session if none exists
    if (!currentConvId || !currentConv) {
      const newId = `conv_${Date.now()}`;
      const title = text.slice(0, 48) + (text.length > 48 ? '...' : '');
      const newConv: Conversation = {
        id: newId,
        userId: user ? user.uid : 'guest',
        title,
        provider: selectedProvider,
        model: selectedModelId,
        systemPrompt: systemPrompt,
        temperature: providerConfig.temperature,
        topP: providerConfig.topP,
        isPinned: false,
        messageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (user) {
        await createConversation(user.uid, newConv);
      } else {
        const updated = [newConv, ...conversations];
        setConversations(updated);
        localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated));
      }
      currentConvId = newId;
      currentConv = newConv;
      setActiveConversationId(newId);
    } else if (messages.length === 0) {
      // Update title with user first message
      const title = text.slice(0, 48) + (text.length > 48 ? '...' : '');
      if (user) {
        await updateConversation(user.uid, currentConvId, { title, updatedAt: new Date().toISOString() });
      } else {
        const updated = conversations.map((c) =>
          c.id === currentConvId ? { ...c, title, updatedAt: new Date().toISOString() } : c
        );
        setConversations(updated);
        localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated));
      }
    }

    // 1. Add User Message
    const userMsgId = `msg_${Date.now()}_u`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      conversationId: currentConvId,
      userId: user ? user.uid : 'guest',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    if (user) {
      await addChatMessage(user.uid, currentConvId, userMessage);
    } else {
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY + currentConvId, JSON.stringify(nextMessages));
    }

    // 2. Start Streaming Assistant Message
    setIsStreaming(true);
    setStreamingContent('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let finalResponseText = '';

    await streamChatCompletion(
      nextMessages,
      {
        provider: selectedProvider,
        model: selectedModelId,
        systemPrompt: currentConv.systemPrompt || systemPrompt,
        temperature: providerConfig.temperature,
        topP: providerConfig.topP,
        ollamaUrl: providerConfig.ollamaUrl,
        lmStudioUrl: providerConfig.lmStudioUrl,
      },
      {
        onToken: (token, fullText) => {
          finalResponseText = fullText;
          setStreamingContent(fullText);
        },
        onComplete: async (fullText, metadata) => {
          setIsStreaming(false);
          setStreamingContent('');
          abortControllerRef.current = null;

          const assistantMsgId = `msg_${Date.now()}_a`;
          const assistantMessage: ChatMessage = {
            id: assistantMsgId,
            conversationId: currentConvId!,
            userId: user ? user.uid : 'guest',
            role: 'assistant',
            content: finalResponseText || fullText,
            modelUsed: selectedModelId,
            tokensUsed: metadata.tokens,
            durationMs: metadata.durationMs,
            createdAt: new Date().toISOString(),
          };

          const allMessages = [...nextMessages, assistantMessage];
          setMessages(allMessages);

          if (user) {
            await addChatMessage(user.uid, currentConvId!, assistantMessage);
            await updateConversation(user.uid, currentConvId!, {
              messageCount: allMessages.length,
              updatedAt: new Date().toISOString(),
            });
          } else {
            localStorage.setItem(
              LOCAL_STORAGE_MESSAGES_KEY + currentConvId,
              JSON.stringify(allMessages)
            );
          }
        },
        onError: (err) => {
          console.error('Inference error:', err);
          setIsStreaming(false);
          setStreamingContent('');
          abortControllerRef.current = null;

          const errorMsgId = `msg_${Date.now()}_err`;
          const errorMessage: ChatMessage = {
            id: errorMsgId,
            conversationId: currentConvId!,
            userId: user ? user.uid : 'guest',
            role: 'assistant',
            content: `⚠️ **Local Engine Notice**: ${err.message}\n\n*Tips: If you are connecting to Ollama, ensure it is running with \`OLLAMA_ORIGINS="*" ollama serve\` so browser tabs can connect. Or switch to the In-Browser WebGPU / Client engine in the top model menu.*`,
            createdAt: new Date().toISOString(),
          };

          const allMessages = [...nextMessages, errorMessage];
          setMessages(allMessages);
          if (!user) {
            localStorage.setItem(
              LOCAL_STORAGE_MESSAGES_KEY + currentConvId,
              JSON.stringify(allMessages)
            );
          }
        },
      },
      abortController.signal
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async () => {
    if (messages.length === 0 || isStreaming) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      await handleSendMessage(lastUserMsg.content);
    }
  };

  const handleSelectModel = (model: LocalModelOption) => {
    setSelectedModelId(model.id);
    setSelectedProvider(model.provider);
  };

  const handleModelListDiscovered = (provider: 'ollama' | 'lmstudio', models: string[]) => {
    const discoveredOptions: LocalModelOption[] = models.map((m) => ({
      id: m,
      name: `${m} (${provider === 'ollama' ? 'Ollama' : 'LM Studio'})`,
      provider,
      recommendedFor: 'Detected from your local runner',
    }));

    setAvailableModels((prev) => {
      const filtered = prev.filter((p) => p.provider !== provider);
      return [...discoveredOptions, ...filtered];
    });

    if (discoveredOptions.length > 0) {
      setSelectedModelId(discoveredOptions[0].id);
      setSelectedProvider(provider);
    }
  };

  const handleSelectPreset = (preset: PromptPreset) => {
    setSystemPrompt(preset.systemPrompt);
    if (preset.initialUserMessage) {
      handleSendMessage(preset.initialUserMessage);
    }
  };

  const handleCreatePreset = async (data: Omit<PromptPreset, 'id' | 'createdAt' | 'userId'>) => {
    const newPreset: PromptPreset = {
      id: `preset_${Date.now()}`,
      userId: user ? user.uid : 'guest',
      title: data.title,
      category: data.category,
      systemPrompt: data.systemPrompt,
      initialUserMessage: data.initialUserMessage,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      await createPromptPreset(user.uid, newPreset);
    } else {
      const updated = [newPreset, ...presets];
      setPresets(updated);
      localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(updated));
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (user) {
      await deletePromptPreset(user.uid, presetId);
    } else {
      const updated = presets.filter((p) => p.id !== presetId);
      setPresets(updated);
      localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(updated));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07090e]">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onTogglePinConversation={handleTogglePin}
        onExportConversation={handleExportConversation}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenPromptLibrary={() => setIsPromptModalOpen(true)}
        onOpenGitHubPages={() => setIsGitHubModalOpen(true)}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      <ChatArea
        conversation={activeConversation}
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        selectedModelId={selectedModelId}
        selectedProvider={selectedProvider}
        availableModels={availableModels}
        temperature={providerConfig.temperature}
        topP={providerConfig.topP}
        systemPrompt={systemPrompt}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onRegenerate={handleRegenerate}
        onSelectModel={handleSelectModel}
        onChangeTemperature={(val) =>
          setProviderConfig((prev) => ({ ...prev, temperature: val }))
        }
        onChangeTopP={(val) => setProviderConfig((prev) => ({ ...prev, topP: val }))}
        onChangeSystemPrompt={setSystemPrompt}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenSidebarMobile={() => setIsSidebarMobileOpen(true)}
      />

      {/* Modals */}
      <GitHubPagesModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      <LocalSetupModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={providerConfig}
        onSaveConfig={setProviderConfig}
        onModelListDiscovered={handleModelListDiscovered}
      />

      <PromptLibraryModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        presets={presets}
        onSelectPreset={handleSelectPreset}
        onCreatePreset={handleCreatePreset}
        onDeletePreset={handleDeletePreset}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
