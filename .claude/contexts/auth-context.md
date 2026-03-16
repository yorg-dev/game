## Authentication Flows

This document is the canonical reference for how user authentication works end-to-end. Both the backend API and frontend game must conform to these flows. Bug reports and fixes should be validated against this document.

---

### Overview

Every visitor gets a session. The lifecycle moves in one direction only:

```
Guest → Registered User
```

A guest cannot be "demoted" back. Signing in never creates new resources — only guest creation and registration do.

---

### Flow 1: New Visitor (Guest Session)

**Trigger:** User arrives at the title screen for the first time (no token in localStorage).

**Frontend steps:**
1. `App.tsx` calls `authProvider.createGuestSession()`
2. Sends `POST /guest` with `device_id` (stable UUID from IndexedDB/localStorage) and `visitor: true`
3. Backend returns `{ token, user: { guest: true }, land_id }`
4. Token and user are stored in localStorage
5. `session-ready` event is emitted on EventBus
6. Title screen appears — user clicks "NEW GAME" → enters `GameScene` immediately

**Backend (POST /guest):**
- If a session token already exists in the request, return it unchanged (idempotent)
- If this is a new guest user **and `visitor` is NOT true**:
  - Creates: Organization → OrganizationMembership (owner) → World → Land → 3 LandObjects (home, bulletin_board, chest)
- If this is an existing guest (device_id match):
  - Fetches and returns their existing first Land
- Returns `{ token, user: { guest: true }, land_id }`

**Important:** The `visitor: true` flag suppresses org/world/land creation for pure browsing sessions. The default land shown in the UI (before any org is created) is a local mock (`DEFAULT_LAND`), not a real backend record.

---

### Flow 2: Guest Plays the Game

**Trigger:** Guest clicks "NEW GAME" from the title screen.

- The guest session token is already present (set in Flow 1)
- Game loads using the `DEFAULT_LAND` mock (local only — no backend land for pure visitors)
- The player can walk around freely
- No organization, world, or real land exists yet on the backend for visitor guests
- The UI shows a "Save Progress" prompt on the ProfileButton (amber indicator)

---

### Flow 3: Guest Registers (Create Account)

**Trigger:** Guest opens LoginModal and submits the "Create Account" tab.

**Frontend steps:**
1. `authProvider.register({ email, password })` is called
2. If no guest session exists yet, one is created first (ensures a guest token is present)
3. Sends `POST /registration` with `Authorization: Bearer <guest_token>`
4. Backend upgrades the guest account and returns `{ token, user: { guest: false } }`
5. New token replaces old guest token in localStorage
6. `login-confirmed` event is emitted
7. `App.tsx` calls `landProvider.getMyFirstLand()` to resolve the newly created real land
8. `land-ready` is emitted and GameScene loads with the real land

**Backend (POST /registration):**
- Only works if the current user is a guest (returns error otherwise)
- Updates user: sets email, password, `guest: false`
- **Scenario A** — guest already has an organization (pre-existing from guest creation without `visitor`):
  - Updates org name from email domain
  - Converts temporary lands to permanent
- **Scenario B** — guest has no organization (visitor guest):
  - Creates: Organization → OrganizationMembership (owner) → World ("My World") → Land ("My Land", 30-day expiry) → 3 LandObjects (home at 240,136; bulletin_board at 184,152; chest at 312,136)
- Queues `registration_completed` achievement
- Returns new token and user with `guest: false`

**Invariant:** Registration always results in exactly one Organization, one World, and one Land for the new user.

---

### Flow 4: Existing User Signs In

**Trigger:** User opens LoginModal and submits the "Sign In" tab.

**Frontend steps:**
1. `authProvider.login({ email, password })` is called
2. Sends `POST /sessions`
3. Backend authenticates and returns `{ token, user: { guest: false } }`
4. Token and user stored in localStorage
5. `login-confirmed` event emitted
6. `App.tsx` calls `landProvider.getMyFirstLand()` to resolve their existing land
7. `land-ready` emitted and GameScene loads

**Backend (POST /sessions):**
- Authenticates by email + password
- Creates a new Session record (captures ip_address, user_agent)
- Queues `session_created` achievement
- **Does NOT create Organization, World, Land, or any other resource**
- Returns `{ token, user: { guest: false } }`

**Invariant:** Sign-in never creates new organizations, worlds, or lands.

---

### Flow 5: Returning User (Auto-Skip)

**Trigger:** User arrives at the title screen with a valid non-guest token already in localStorage.

**Frontend steps:**
1. `App.tsx` checks `sessionStorage._returningUser` flag (set if token existed on page load)
2. `TitleScene` skips the menu and goes straight to `GameScene`
3. `landProvider.getMyFirstLand()` is called to resolve their land
4. No new session is created — existing token is reused

---

### Flow 6: Sign Out

**Frontend steps:**
1. `authProvider.logout()` sends `DELETE /sessions` (non-fatal if it fails)
2. Clears `token` and `user` from localStorage
3. Calls `clearDeviceId()` — removes device ID from both localStorage and IndexedDB
4. Emits `logout` event on EventBus
5. Returns to TitleScene; next visit treats user as a new guest

---

### Land Resolution — `getMyFirstLand()`

After login or registration, the frontend resolves the user's land by walking the API hierarchy:

```
GET /organizations
  → GET /organizations/{id}/worlds
    → GET /worlds/{id}/lands
      → GET /lands/{id}   (full detail with viewer permissions)
```

Returns the first Land of the first World of the first Organization. If none exists, falls back to `DEFAULT_LAND` (local mock).

---

### Data Created Per Flow

| Flow               | Organization | World | Land | LandObjects | Session |
|--------------------|:---:|:-----:|:----:|:-----------:|:-------:|
| Guest (non-visitor)| ✓   | ✓     | ✓    | ✓ (3)       | ✓       |
| Guest (visitor)    | —   | —     | —    | —           | ✓       |
| Register (Scenario A) | (update) | — | (convert) | — | ✓  |
| Register (Scenario B) | ✓  | ✓    | ✓    | ✓ (3)       | ✓       |
| Sign In            | —   | —     | —    | —           | ✓       |

---

### Default Land Objects Created

On guest creation (non-visitor) or registration (Scenario B), three LandObjects are seeded:

| Type           | X     | Y     |
|----------------|-------|-------|
| home           | 240.0 | 136.0 |
| bulletin_board | 184.0 | 152.0 |
| chest          | 312.0 | 136.0 |

---

### Token & Storage

| Key              | Storage      | Value                        |
|------------------|--------------|------------------------------|
| `token`          | localStorage | Bearer token string          |
| `user`           | localStorage | JSON `{ id, email, role, guest }` |
| `_returningUser` | sessionStorage | `'1'` or `'0'`             |
| `deviceId`       | localStorage + IndexedDB | UUID v4 (stable across sessions) |

- All API requests inject `Authorization: Bearer {token}` automatically via `httpProvider`
- A 403 response triggers the register modal
- Guest status is determined by `user.guest === true`

---

### EventBus Auth Events

| Event            | Direction              | When                                       |
|------------------|------------------------|--------------------------------------------|
| `session-ready`  | App → all              | Guest session established, safe to proceed |
| `show-login`     | TitleScene → React     | User clicked "LOAD WORLD"                  |
| `login-confirmed`| React → TitleScene     | Successful login or registration           |
| `login-cancelled`| React → TitleScene     | User dismissed login modal                 |
| `game-started`   | TitleScene → App       | Transitioning from title to GameScene      |
| `land-ready`     | App → all              | Land and placements resolved and loaded    |
| `logout`         | ProfileButton → all    | User signed out                            |

---

### Common Bugs to Check Against This Document

- **Sign-in creates a new org:** Must not happen — `POST /sessions` creates nothing except a Session record.
- **Registration fails for non-guest user:** `POST /registration` requires `guest: true` on the current user.
- **Guest visitor gets a real org/world/land:** Only happens if `visitor: true` is omitted from `POST /guest`.
- **Land not found after registration:** `getMyFirstLand()` must be called after the new token is set in localStorage.
- **Returning user sees title screen instead of game:** Check `sessionStorage._returningUser` flag and TitleScene auto-skip logic.
- **Double org creation on registration:** Guest was created without `visitor: true` AND registration hit Scenario B. The backend should detect the existing org (Scenario A) and skip creation.
