# Yorg Constitution

## Project Overview

Yorg is a 2D top-down pixel art game running entirely in the browser.
Business Owners deploy AI Agents as pixel art characters onto a game world.
Agents animate, move, and display notifications when active. The game connects
to external APIs where agents perform their actual work; the browser game is
the real-time visual interface for that work.

**Stack**: TypeScript 5.x · React 19 (UI overlay) · Phaser 3 (game engine) ·
Vite 8 (build)

## Core Principles

### I. Scene-First Architecture

Phaser Scenes are the primary unit of game organization. Each Scene MUST own
its lifecycle (preload / create / update / shutdown) completely and MUST NOT
reach directly into another Scene's objects. Cross-scene communication MUST go
through Phaser's built-in event emitter (`this.events` / `this.game.events`)
or a shared typed event bus — never via direct scene references. Game Objects
(sprites, groups, tilemap layers) MUST be created and destroyed within the
Scene that owns them.

**Rationale**: Scenes are Phaser's isolation boundary. Violating scene
encapsulation creates hidden coupling that causes hard-to-debug lifecycle
bugs as the number of scenes grows.

### II. TypeScript Strict Mode (NON-NEGOTIABLE)

All source files MUST compile under `"strict": true` with zero type errors.
The `any` type is banned; use `unknown` with explicit narrowing where the type
is not statically knowable. All exported classes, functions, and event payloads
MUST carry explicit type annotations. Phaser's `GameObjects.GameObject` MUST
always be narrowed to a concrete subtype before use. `as` assertions require an
inline comment explaining why the assertion is safe.

**Rationale**: TypeScript's safety guarantees collapse the moment `any` enters
game object hierarchies. Phaser's generics are expressive enough to model the
game domain fully; strict typing is achievable and non-negotiable.

### III. React/Phaser Bridge Contract

React and Phaser are two independent runtimes sharing the same browser tab.
They MUST communicate exclusively through a singleton typed event bus (an
`EventEmitter` instance shared at module scope). React MUST NOT hold references
to Phaser game objects. Phaser MUST NOT call React state setters directly.
The canvas is owned by Phaser; all DOM outside the canvas is owned by React.
The event bus interface MUST be defined as a TypeScript interface with named,
typed events; untyped string events are banned.

**Rationale**: Without an explicit contract, the two systems create circular
dependencies and race conditions at teardown. A typed bus makes the integration
surface explicit, auditable, and refactorable.

### IV. Agent State Machine

Every AI Agent is modeled as an explicit finite state machine with typed states
and transitions. Valid states MUST be defined as a TypeScript union type (e.g.,
`'idle' | 'moving' | 'working' | 'notifying' | 'error'`). State transitions
MUST only occur in response to API events or user commands — never driven by
animation callbacks or game-loop timers alone. All API responses MUST be
enqueued into a command buffer; the game loop dequeues and applies commands
each frame. No agent state transition may block the game loop thread.

**Rationale**: Agents are the core entity of the game. Modeling them as state
machines makes their behavior predictable, testable in isolation from Phaser,
and resilient to out-of-order API events.

### V. 60fps Game Loop Budget

The Phaser `update()` method MUST complete in under 16 ms. No network I/O,
file I/O, or synchronous computation heavier than O(n) over active agents may
occur inside `update()`. All API calls MUST be made outside the game loop (in
response to events) and their results queued for the next frame. Assets (sprite
atlases, tilemaps, audio) MUST be fully preloaded in a dedicated loading scene
before gameplay begins; no asset loading DURING gameplay. Individual images are
banned for animated sprites — use texture atlases.

**Rationale**: Frame drops break the illusion of a live game world. Keeping
the game loop lean and asset loading front-loaded ensures a stable 60fps on
mid-range hardware regardless of API latency.

## Technology Constraints

- **Language**: TypeScript 5.x, `"strict": true`, ESM modules only.
- **Game Engine**: Phaser 3 — use Scenes, Game Objects, and the Loader as
  designed; do not bypass Phaser's lifecycle with raw Canvas/WebGL calls.
- **UI Overlay**: React 19 — renders outside the Phaser canvas; handles HUD,
  menus, agent notifications, and dashboard panels.
- **Build Tool**: Vite 8 — asset imports for sprites/tilemaps go through Vite's
  asset pipeline; `?url` imports for Phaser's asset loader.
- **Linting**: ESLint 9 with `eslint-plugin-react-hooks`; lint warnings are
  errors in CI.
- **Package Management**: npm with committed lock-file; do not mix managers.
- **External APIs**: All API communication is async (fetch / WebSocket); API
  modules are decoupled from Phaser and testable without a running game instance.

## Development Workflow

- **Branching**: Feature branches named `###-short-description`; PRs target `main`.
- **Code Review**: Every PR requires at least one approving review.
  Reviewers MUST explicitly verify Constitution compliance.
- **Quality Gates** (all MUST pass before merge):
  1. `tsc --noEmit` — zero type errors.
  2. `eslint .` — zero warnings or errors.
  3. Unit tests for state machines and API adapter logic green.
  4. Manual smoke test: game loads, an agent spawns, receives a mock API event,
     and transitions state correctly.
- **Commit Style**: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- **Asset Conventions**: Sprite atlases use Phaser-compatible JSON hash format;
  tile size MUST be consistent across a tilemap (default: 16×16 px); file names
  are `kebab-case`.
- **Complexity Justification**: Any deviation from a Constitution principle MUST
  be documented in the PR description with rationale and owner approval.

## Governance

This Constitution supersedes all other development practices in this repository.
When a practice conflicts with this document, the Constitution takes precedence.

**Amendment Procedure**:
1. Open a PR titled `docs: amend constitution to vX.Y.Z — <summary>`.
2. Describe the change, the reason, and any migration required.
3. Obtain approval from the repository owner.
4. Update `LAST_AMENDED_DATE` and increment `CONSTITUTION_VERSION` per the
   versioning policy below.
5. Propagate changes to all dependent templates in the same PR or a referenced
   follow-up.

**Versioning Policy**:
- **MAJOR**: Principle removed or fundamentally redefined.
- **MINOR**: New principle or section added, or material expansion of guidance.
- **PATCH**: Clarifications, wording fixes, non-semantic refinements.

**Compliance Reviews**: All PRs include a Constitution compliance check.
Quarterly reviews assess whether principles remain appropriate for project scale.
