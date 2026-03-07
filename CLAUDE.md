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
