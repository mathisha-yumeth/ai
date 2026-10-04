export type ModelProvider = 'ollama' | 'lmstudio' | 'webgpu' | 'local_engine';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
  selectedProvider?: ModelProvider;
  selectedModel?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  provider: ModelProvider;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  isPinned?: boolean;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
  durationMs?: number;
  createdAt: string;
}

export interface PromptPreset {
  id: string;
  userId: string;
  title: string;
  category?: string;
  systemPrompt: string;
  initialUserMessage?: string;
  createdAt: string;
}

export interface LocalModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  size?: string;
  parameters?: string;
  recommendedFor?: string;
  contextWindow?: number;
  isRecommended?: boolean;
}

export interface ProviderConfig {
  ollamaUrl: string;
  lmStudioUrl: string;
  webGpuModelId: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}
