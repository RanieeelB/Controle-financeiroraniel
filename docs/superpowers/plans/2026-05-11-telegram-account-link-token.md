# Telegram Account Link Token Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-time Telegram account linking via a unique per-account token generated in Settings and consumed once by the Telegram bot.

**Architecture:** Introduce a dedicated `telegram_connections` persistence layer keyed by `user_id`, plus a secure server-side token generation route for authenticated users. Update the Telegram webhook to resolve users by persisted `telegram_user_id`, falling back to a token-linking onboarding flow only when no link exists yet.

**Tech Stack:** React 19, Vite, Supabase, Vercel serverless functions, Vitest, ESLint, TypeScript.

---

## File Structure

- Create `supabase/migrations/<timestamp>_create_telegram_connections.sql`: create the Telegram linkage table, constraints, indexes, and RLS policies.
- Create `src/lib/telegramConnectionPayloads.ts`: pure helpers for token state normalization if needed.
- Create `src/lib/telegramConnectionPayloads.test.ts`: failing tests for helpers.
- Create `api/telegram/link-token.ts`: authenticated serverless route to generate and persist the one-time token.
- Modify `api/telegram/webhook.ts`: add linking flow before financial command handling.
- Create `src/services/telegram/telegramLinkService.ts`: token generation, hashing, comparison, and link resolution logic.
- Create `src/services/telegram/telegramLinkService.test.ts`: tests for one-time token behavior and uniqueness.
- Modify `src/services/telegram/telegramService.ts`: support onboarding state and token submission.
- Modify `src/services/telegram/telegramService.test.ts`: add tests for token prompt, successful link, invalid token, and already-linked flow.
- Modify `src/pages/Settings.tsx`: add Telegram settings card and one-time display flow.
- Create `src/hooks/useTelegramConnection.ts`: fetch current Telegram token/vinculation status for the logged-in user.
- Modify or create supporting frontend/backend files as needed for authenticated status retrieval.

## Chunk 1: Database and Pure Test Coverage

- [ ] **Step 1: Write the failing tests for token and link helpers**

Create `src/services/telegram/telegramLinkService.test.ts` covering:

- unique token generation format;
- hash comparison without storing raw token;
- one-time token invalidation after linking;
- rejection when `telegram_user_id` is already linked elsewhere.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/services/telegram/telegramLinkService.test.ts`

Expected: FAIL because the service does not exist yet.

- [ ] **Step 3: Add the database migration**

Create `supabase/migrations/<timestamp>_create_telegram_connections.sql` with:

- `telegram_connections` table;
- `user_id` unique foreign key to `auth.users(id)`;
- `telegram_user_id` unique nullable column;
- nullable `link_token_hash`;
- `token_generated_at`, `linked_at`, `telegram_chat_id`;
- RLS policies allowing the authenticated user to read its own record and backend service role to manage records.

- [ ] **Step 4: Implement minimal link service to satisfy the tests**

Create `src/services/telegram/telegramLinkService.ts` with focused functions for:

- generating a strong token;
- hashing token values;
- validating a provided token against stored hash;
- finalizing a link and clearing the hash.

- [ ] **Step 5: Re-run the focused test**

Run: `npm test -- src/services/telegram/telegramLinkService.test.ts`

Expected: PASS.

## Chunk 2: Authenticated Token Generation Route

- [ ] **Step 6: Write the failing server-side generation test**

Add a test for `api/telegram/link-token.ts` or for a route helper showing:

- authenticated user without connection can generate a token once;
- response returns raw token only at generation time;
- second generation attempt is rejected;
- no raw token is persisted.

- [ ] **Step 7: Run the focused test to verify it fails**

Run the new test file only.

Expected: FAIL because the route does not exist yet.

- [ ] **Step 8: Implement the token generation route**

Create `api/telegram/link-token.ts` that:

- validates authenticated Supabase session;
- checks whether a link row already exists or token was already generated;
- generates the raw token;
- stores only its hash;
- returns the raw token once in JSON.

- [ ] **Step 9: Re-run the focused route test**

Run the same focused test command.

Expected: PASS.

## Chunk 3: Telegram Onboarding Flow

- [ ] **Step 10: Extend Telegram service tests first**

Update `src/services/telegram/telegramService.test.ts` with cases for:

- `/start` asking for token when no link exists;
- successful link after valid token message;
- invalid token message;
- linked user skipping onboarding and reaching normal bot behavior.

- [ ] **Step 11: Run the focused Telegram service tests to verify failure**

Run: `npm test -- src/services/telegram/telegramService.test.ts`

Expected: FAIL because onboarding flow is not implemented yet.

- [ ] **Step 12: Implement webhook and service onboarding logic**

Modify `src/services/telegram/telegramService.ts` and `api/telegram/webhook.ts` so that:

- linked users are resolved by `telegram_user_id`;
- unlinked users are prompted for token;
- token messages attempt a secure link;
- successful link stores `telegram_user_id`, `telegram_chat_id`, `linked_at`, clears `link_token_hash`;
- financial parsing only runs after link resolution.

- [ ] **Step 13: Re-run the focused Telegram service tests**

Run: `npm test -- src/services/telegram/telegramService.test.ts`

Expected: PASS.

## Chunk 4: Settings UI

- [ ] **Step 14: Write the failing UI/source test**

Add or extend a focused test to assert that `Settings.tsx` contains:

- a Telegram section;
- a one-time generate action;
- states for `aguardando vinculação` and `Telegram conectado`;
- no regenerate/edit affordance once a token exists.

- [ ] **Step 15: Run the focused UI test to verify failure**

Run the specific test file only.

Expected: FAIL because the UI does not exist yet.

- [ ] **Step 16: Implement frontend status hook and settings card**

Create `src/hooks/useTelegramConnection.ts` and update `src/pages/Settings.tsx` to:

- fetch Telegram link status for the logged-in user;
- request token generation from the backend;
- display the raw token once after generation;
- persist a local dismissed state only for presentation, never as authority;
- render the correct status messaging afterward.

- [ ] **Step 17: Re-run the focused UI test**

Run the same focused UI test command.

Expected: PASS.

## Chunk 5: Validation and Release Hygiene

- [ ] **Step 18: Run targeted Telegram tests**

Run:

- `npm test -- src/services/telegram/telegramParser.test.ts src/services/telegram/telegramActions.test.ts src/services/telegram/telegramService.test.ts src/services/telegram/telegramLinkService.test.ts`

Expected: PASS.

- [ ] **Step 19: Run full project validation**

Run:

- `npm run lint`
- `npm run build`
- `npm run android:sync`

Expected: all commands exit 0.

- [ ] **Step 20: Review working tree**

Run:

- `git status --short`
- `git diff`

Confirm no secrets, generated tokens, build artifacts, or unrelated reversions are present.

- [ ] **Step 21: Commit in small semantic checkpoints**

Suggested commits:

```bash
git add supabase/migrations src/services/telegram api/telegram
git commit -m "feat: add telegram account link backend"

git add src/pages/Settings.tsx src/hooks
git commit -m "feat: add telegram link token settings"
```
