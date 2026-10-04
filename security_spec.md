# Security Specification & Threat Model

## 1. Data Invariants
- **Strict Ownership**: Every document under `/users/{userId}` belongs solely to `{userId}`. No user may read, list, create, update, or delete another user's documents.
- **Identity Integrity**: `request.auth.uid` must equal `{userId}` and `incoming().userId` on create and update.
- **Master Gate**: Access to `/users/{userId}/conversations/{conversationId}` and `/users/{userId}/conversations/{conversationId}/messages/{messageId}` is locked strictly to `{userId} == request.auth.uid`.
- **Verified Identity**: Write operations require `request.auth != null`.
- **Immortal Fields**: Fields like `id`, `userId`, `conversationId`, and `createdAt` cannot be modified after initial creation.
- **Payload Truncation & String Size Limits**: Messages are limited to <= 65536 characters, titles to <= 256 characters, system prompts to <= 8192 characters.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1: Cross-User Profile Poisoning**
   - Attempt: User B attempts to write or overwrite User A's profile `/users/user_A`.
   - Expected: PERMISSION_DENIED (User B UID != user_A).

2. **Payload 2: Shadow Field Injection in Profile**
   - Attempt: User A sends ghost field `role: "admin"` or `isAdmin: true` in `/users/user_A`.
   - Expected: PERMISSION_DENIED (keys().hasOnly violates schema).

3. **Payload 3: Cross-User Conversation Creation**
   - Attempt: User B tries to inject a conversation doc into `/users/user_A/conversations/conv1`.
   - Expected: PERMISSION_DENIED (`userId != request.auth.uid`).

4. **Payload 4: Identity Spoofing in Conversation Body**
   - Attempt: User A creates a conversation in `/users/user_A/conversations/conv1` but sets `userId: "user_B"`.
   - Expected: PERMISSION_DENIED (`incoming().userId != request.auth.uid`).

5. **Payload 5: Giant String DOS on Message Body**
   - Attempt: User sends a message with `content` of 2MB string.
   - Expected: PERMISSION_DENIED (`content.size() <= 65536` violated).

6. **Payload 6: Invalid Message Role Injection**
   - Attempt: User sets `role: "god_mode"` or `role: "root"`.
   - Expected: PERMISSION_DENIED (`role in ['user', 'assistant', 'system']` violated).

7. **Payload 7: Cross-Conversation Message Attachment**
   - Attempt: In `/users/user_A/conversations/conv1/messages/msg1`, `incoming().conversationId` is set to `"conv2"`.
   - Expected: PERMISSION_DENIED (`incoming().conversationId != conversationId`).

8. **Payload 8: Immutable Timestamp Tampering**
   - Attempt: User updates a conversation modifying `createdAt` to a backdated timestamp.
   - Expected: PERMISSION_DENIED (`incoming().createdAt == existing().createdAt` violated).

9. **Payload 9: Unauthenticated Reader Leak**
   - Attempt: Anonymous/unauthenticated client queries `/users/user_A/conversations`.
   - Expected: PERMISSION_DENIED (`request.auth != null` required).

10. **Payload 10: Path Variable ID Poisoning**
    - Attempt: Writing to document ID with illegal characters or > 128 characters like `/users/user_A/conversations/<1.5kb string>`.
    - Expected: PERMISSION_DENIED (`isValidId` guard fails).

11. **Payload 11: Cross-User Message Mutation**
    - Attempt: User B attempts to delete or patch a message in User A's conversation.
    - Expected: PERMISSION_DENIED.

12. **Payload 12: Prompt Preset Spoofing**
    - Attempt: User attempts to create a preset with oversized systemPrompt (> 8192 chars) or fake owner.
    - Expected: PERMISSION_DENIED.

## 3. Test Runner
Included in `firestore.rules.test.ts` to ensure rejection of all twelve malicious payloads.
