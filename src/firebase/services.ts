import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import { OperationType, handleFirestoreError } from './errors';
import { Conversation, ChatMessage, PromptPreset, UserProfile } from '../types/chat';

// Save or update UserProfile
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const data: Record<string, unknown> = {
      id: profile.id,
      email: profile.email,
      createdAt: profile.createdAt,
    };
    if (profile.displayName) data.displayName = profile.displayName.slice(0, 128);
    if (profile.photoURL) data.photoURL = profile.photoURL.slice(0, 1024);
    if (profile.updatedAt) data.updatedAt = profile.updatedAt;
    if (profile.selectedProvider) data.selectedProvider = profile.selectedProvider;
    if (profile.selectedModel) data.selectedModel = profile.selectedModel.slice(0, 128);

    await setDoc(doc(db, 'users', profile.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to User Conversations
export function subscribeToConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): () => void {
  const path = `users/${userId}/conversations`;
  try {
    const q = query(collection(db, 'users', userId, 'conversations'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const conversations: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          conversations.push(docSnap.data() as Conversation);
        });
        onUpdate(conversations);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

// Create Conversation
export async function createConversation(userId: string, conversation: Conversation): Promise<void> {
  const path = `users/${userId}/conversations/${conversation.id}`;
  try {
    const data: Record<string, unknown> = {
      id: conversation.id,
      userId: userId,
      title: conversation.title.slice(0, 256),
      provider: conversation.provider,
      model: conversation.model.slice(0, 128),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isPinned: Boolean(conversation.isPinned),
      messageCount: conversation.messageCount || 0,
      temperature: conversation.temperature ?? 0.7,
      topP: conversation.topP ?? 0.9,
    };
    if (conversation.systemPrompt) {
      data.systemPrompt = conversation.systemPrompt.slice(0, 8192);
    }
    await setDoc(doc(db, 'users', userId, 'conversations', conversation.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update Conversation
export async function updateConversation(
  userId: string,
  conversationId: string,
  updates: Partial<Conversation>
): Promise<void> {
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.title !== undefined) cleanUpdates.title = updates.title.slice(0, 256);
    if (updates.provider !== undefined) cleanUpdates.provider = updates.provider;
    if (updates.model !== undefined) cleanUpdates.model = updates.model.slice(0, 128);
    if (updates.systemPrompt !== undefined) cleanUpdates.systemPrompt = updates.systemPrompt.slice(0, 8192);
    if (updates.temperature !== undefined) cleanUpdates.temperature = updates.temperature;
    if (updates.topP !== undefined) cleanUpdates.topP = updates.topP;
    if (updates.isPinned !== undefined) cleanUpdates.isPinned = updates.isPinned;
    if (updates.messageCount !== undefined) cleanUpdates.messageCount = updates.messageCount;

    await updateDoc(doc(db, 'users', userId, 'conversations', conversationId), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete Conversation (and its subcollection messages)
export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const path = `users/${userId}/conversations/${conversationId}`;
  try {
    // Delete messages subcollection
    const messagesRef = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
    const msgSnap = await getDocs(messagesRef);
    const deletePromises = msgSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // Delete conversation doc
    await deleteDoc(doc(db, 'users', userId, 'conversations', conversationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscribe to Messages in a Conversation
export function subscribeToMessages(
  userId: string,
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  const path = `users/${userId}/conversations/${conversationId}/messages`;
  try {
    const q = query(collection(db, 'users', userId, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          messages.push(docSnap.data() as ChatMessage);
        });
        onUpdate(messages);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

// Add Chat Message
export async function addChatMessage(
  userId: string,
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  const path = `users/${userId}/conversations/${conversationId}/messages/${message.id}`;
  try {
    const data: Record<string, unknown> = {
      id: message.id,
      conversationId: message.conversationId,
      userId: userId,
      role: message.role,
      content: message.content.slice(0, 65536),
      createdAt: message.createdAt,
    };
    if (message.modelUsed) data.modelUsed = message.modelUsed.slice(0, 128);
    if (typeof message.tokensUsed === 'number') data.tokensUsed = message.tokensUsed;
    if (typeof message.durationMs === 'number') data.durationMs = message.durationMs;

    await setDoc(doc(db, 'users', userId, 'conversations', conversationId, 'messages', message.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Subscribe to Prompt Presets
export function subscribeToPromptPresets(
  userId: string,
  onUpdate: (presets: PromptPreset[]) => void
): () => void {
  const path = `users/${userId}/promptPresets`;
  try {
    const q = query(collection(db, 'users', userId, 'promptPresets'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const presets: PromptPreset[] = [];
        snapshot.forEach((docSnap) => {
          presets.push(docSnap.data() as PromptPreset);
        });
        onUpdate(presets);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

// Create Prompt Preset
export async function createPromptPreset(userId: string, preset: PromptPreset): Promise<void> {
  const path = `users/${userId}/promptPresets/${preset.id}`;
  try {
    const data: Record<string, unknown> = {
      id: preset.id,
      userId: userId,
      title: preset.title.slice(0, 128),
      systemPrompt: preset.systemPrompt.slice(0, 8192),
      createdAt: preset.createdAt,
    };
    if (preset.category) data.category = preset.category.slice(0, 64);
    if (preset.initialUserMessage) data.initialUserMessage = preset.initialUserMessage.slice(0, 4096);

    await setDoc(doc(db, 'users', userId, 'promptPresets', preset.id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Delete Prompt Preset
export async function deletePromptPreset(userId: string, presetId: string): Promise<void> {
  const path = `users/${userId}/promptPresets/${presetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'promptPresets', presetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
