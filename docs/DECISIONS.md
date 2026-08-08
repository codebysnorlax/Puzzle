# Image Puzzle PWA — Architectural Decision Records (ADR)

## ADR 001: Build Application in Strict Phases
- **Status**: Accepted
- **Context**: Large complex apps suffer from regression and missing context if built in monolithic passes.
- **Decision**: Develop strictly according to Phase 0 – Phase 20 outlined in `PRD.md`. Validate and test every phase before advancing.
- **Consequences**: Ensures clean architecture, thorough testing, and predictable progress.

## ADR 002: Vanilla JavaScript + Vite Stack
- **Status**: Accepted
- **Context**: The game needs lightweight high-performance rendering without UI framework overhead.
- **Decision**: Use Vanilla JS (ES Modules) bundled with Vite. Do not introduce React, Vue, or Svelte.
- **Consequences**: Zero framework overhead, ultra-fast initial PWA load time.

## ADR 003: PixiJS for Canvas Puzzle Rendering
- **Status**: Accepted
- **Context**: Rendering 64+ interactive pieces with smooth drag/snap feedback on HTML DOM elements causes layout thrashing.
- **Decision**: Use PixiJS WebGL/WebGPU 2D canvas engine for puzzle rendering.
- **Consequences**: Smooth 60fps rendering, hardware-accelerated texture masking, fast pointer interaction.

## ADR 004: Local-First Client-Side Storage Architecture
- **Status**: Accepted
- **Context**: App must work offline and protect user privacy.
- **Decision**: Store light settings in `localStorage` and user image Blobs + game history in `IndexedDB`.
- **Consequences**: No server or database required; fully compatible with Cloudflare Pages static hosting.

## ADR 005: Seed-Based Random Shuffle & Anti-Cheat Rule
- **Status**: Accepted
- **Context**: Puzzle state needs to be unpredictable for each game session.
- **Decision**: Generate piece placements from a random seed on game start. Reopening a puzzle always generates a new seed and random arrangement; solved states are never restored as active puzzles.
- **Consequences**: Prevents resume-exploit anti-cheat issues and provides high replayability.

## ADR 006: Separation of Engine, Renderer, and Storage
- **Status**: Accepted
- **Context**: Tightly coupling canvas rendering with puzzle mathematical rules creates fragile, untestable code.
- **Decision**: Puzzle Engine (math, state, validation) relies on pure JS functions with zero dependencies on PixiJS, DOM, or IndexedDB.
- **Consequences**: Enables pure unit testing of puzzle validation, shuffling, and timer math.
