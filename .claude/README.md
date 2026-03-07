# .claude Directory - AI Assistant Navigation Guide

Welcome to the AI assistant documentation! This directory contains all AI-specific instructions, workflows, domain knowledge, and context for working with this application.

## Quick Start

**For the main entry point**, see `/CLAUDE.md` in the project root for quick trigger phrases and overview.

**For detailed workflows**, use the spec kit commands listed below.

**For domain knowledge**, see the contexts section.

## Directory Structure

```
.claude/
├── README.md              # This file - navigation guide
├── commands/              # Executable spec kit workflows
│   ├── speckit.*.md
│   └── speckit.*.md
└── contexts/               # Domain knowledge and architecture
    ├── backend-context.md  # Models used to communicate with backend
    ├── model-context.md    # Models used to communicate with backend
    └── phaser-context.md   # Phaser js game engine
```

## Project Architecture

### React Structure

```
src/
├── assets/              # Static assets, images, audio
├── components/          # UI components
├── game/                # Phaser game components
└── lib/utils.ts         # Utilities
```

### Constitutional Requirements

The project follows strict constitutional principles (`.specify/memory/constitution.md`):
