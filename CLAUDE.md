# Claude Code Instructions

All AI assistant instructions are organized in the `.claude` directory.

## Getting Started

**Read this first**: `.claude/README.md` - Complete navigation guide and quick reference

## Directory Structure

```
.claude/
├── commands/      # Step-by-step processes
└── contexts/      # Domain knowledge

.specify/
├── memory/        # Constitution
├── standards/     # Quality gates & requirements
├── patterns/      # Implementation reference
└── templates/     # Scaffolding & examples
```

### Spec Kit Planning Commands

These commands are part of the broader spec kit system:

- `/speckit.plan` - Create implementation plan with phases
- `/speckit.specify` - Create feature specification
- `/speckit.tasks` - Generate task list from spec/plan
- `/speckit.implement` - Execute tasks
- `/speckit.analyze` - Analyze spec/plan/task consistency
- `/speckit.constitution` - Update project constitution
- `/speckit.checklist` - Generate custom checklist
- `/speckit.clarify` - Ask clarification questions

### Core Commands

#### `/speckit.my-new-feature`
**Purpose**: Create complete Rails model feature
**Creates**: Migration, model, factory, specs, API controller, serializer, ability, routes, seeds
**Trigger**: "Add new feature with model [ModelName]"
**Use case**: New model with full CRUD API and authorization

### Context7

This repo uses Context7 to search known package documentation.

#### Stack Note

This project uses **`ra-core`** only — NOT the `react-admin` package (no Material UI). For layouts, lists, forms, and UI components use **Shadcn Admin Kit** (`@/components/admin`), which is the shadcn/tailwind implementation of react-admin.

#### Library IDs

| Library | Context7 ID | Notes |
|---------|-------------|-------|
| Shadcn Admin Kit (layouts/UI) | `/marmelab/shadcn-admin-kit` | shadcn+tailwind react-admin components |
| ra-core (hooks/context) | `/marmelab/react-admin` | 6600+ snippets — use for hooks like `useListContext`, `useRecordContext`, `ListBase`, etc. |
| Phaser | `/websites/phaser_io` | 12180+ snippets, High reputation |

#### Usage Examples

- Look up a layout component: `use context7 for /marmelab/shadcn-admin-kit to look up the <List> component props`
- Look up a hook: `use context7 for /marmelab/react-admin to look up useRecordContext`
