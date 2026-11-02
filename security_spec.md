# Security Specification: YASMIN AI Cloud Architecture

## 1. Data Invariants
1. **User Identity Boundary**: A user can never read, query, update, or delete another user's personal memories, conversations, messages, preferences, or tasks.
2. **Owner Verification**: Every document creation for user-scoped collections (`memories`, `conversations`, `messages`, `tasks`, `user_preferences`) must strictly have `userId == request.auth.uid`.
3. **Role Elevation Prevention**: Regular users cannot elevate their own role to 'admin' or 'owner' in `/users/{userId}` or create entries in `/admins/`.
4. **Admin / Owner Protection**: Global collections (`remote_config`, `feature_flags`, `app_versions`) are readable by authenticated users so the client app can adapt dynamically, but writable ONLY by verified administrators (`isAdmin()`).
5. **Anti-Update Gap**: Updates must explicitly validate schema bounds and restrict modified keys via `affectedKeys().hasOnly(...)`.
6. **Immutable Provenance**: Document `userId` and `createdAt` cannot be modified after creation.

## 2. The Dirty Dozen Payloads (Targeting Denial, Poisoning, & Leaks)
1. **Payload 1 (Identity Theft in Memory)**: Attacker with UID `user_b` attempts to write memory with `userId: 'user_a'`. (Must be REJECTED).
2. **Payload 2 (Ghost Field Attack in Conversation)**: User attempts to write conversation with extra injected field `isSuperAdmin: true`. (Must be REJECTED).
3. **Payload 3 (ID Poisoning Attack)**: Document ID containing 5000 characters or illegal path traversal `/memories/../../root`. (Must be REJECTED).
4. **Payload 4 (Blanket Memory Scraping)**: Attacker attempts `list` on `/memories` without `userId == request.auth.uid` filter. (Must be REJECTED).
5. **Payload 5 (Cross-User Conversation Reading)**: Attacker attempts `get` on `/conversations/conv_user_a` owned by another user. (Must be REJECTED).
6. **Payload 6 (Unauthorized Remote Config Modification)**: Non-admin user attempts to update `/remote_config/system_prompt`. (Must be REJECTED).
7. **Payload 7 (Feature Flag Tampering)**: Regular user attempts to delete or alter `/feature_flags/voice_live`. (Must be REJECTED).
8. **Payload 8 (Memory Content Buffer Overflow)**: Attacker attempts to store a 5MB payload string in `content` field. (Must be REJECTED by `.size() <= 2048`).
9. **Payload 9 (Role Self-Assignment in User Profile)**: User creates `/users/{uid}` with `role: 'owner'`. (Must be REJECTED).
10. **Payload 10 (Sub-resource Hijack in Messages)**: Attacker attempts to post a message into another user's conversation. (Must be REJECTED).
11. **Payload 11 (App Version Spoofing)**: Regular user attempts to push a fake APK release into `/app_versions/`. (Must be REJECTED).
12. **Payload 12 (Unauthenticated Query Attack)**: Anonymous unverified client attempts to read `/user_preferences`. (Must be REJECTED).
