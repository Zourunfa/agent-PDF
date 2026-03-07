# Claude Code Configuration for agent-pdf

This project uses GitHub Spec Kit for Spec-Driven Development with Claude Code.

## Available Slash Commands

The following Spec Kit commands are available to guide structured development:

### Core Commands

- **`/speckit.constitution`** - Create or update project governing principles and development guidelines
- **`/speckit.specify`** - Define what you want to build (requirements and user stories)
- **`/speckit.plan`** - Create technical implementation plans with your chosen tech stack
- **`/speckit.tasks`** - Generate actionable task lists for implementation
- **`/speckit.implement`** - Execute all tasks to build the feature according to the plan

### Optional Commands

- **`/speckit.clarify`** - Clarify underspecified areas (recommended before `/speckit.plan`)
- **`/speckit.analyze`** - Cross-artifact consistency & coverage analysis (run after `/speckit.tasks`)
- **`/speckit.checklist`** - Generate custom quality checklists

## Project Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project governing principles
├── specs/                       # Feature specifications
│   └── <feature-name>/
│       ├── spec.md              # Feature specification
│       ├── plan.md              # Implementation plan
│       ├── tasks.md             # Task breakdown
│       └── ...                  # Additional documentation
├── scripts/                     # Automation scripts
├── templates/                   # Spec Kit templates
.claude/
└── skills/                      # Claude Code skill definitions
```

## Getting Started

1. Use `/speckit.constitution` to establish project principles (already created)
2. Use `/speckit.specify` to describe what you want to build
3. Use `/speckit.plan` to provide technical stack and architecture choices
4. Use `/speckit.tasks` to break down into actionable tasks
5. Use `/speckit.implement` to execute implementation

## Important Notes

- Focus on "what" and "why" during specification, not "how"
- Technical stack decisions belong in the planning phase
- Specifications should be executable, not just descriptive
- Quality and clarity in specs reduce rework during implementation
- Use the constitution to guide all technical decisions

## Environment Variables

- `SPECIFY_FEATURE` - Override feature detection for non-Git repositories (set to feature directory name like "001-feature-name")

## Active Technologies
- TypeScript 5.x (strict mode) (001-pdf-chat-app)

## Recent Changes
- 001-pdf-chat-app: Added TypeScript 5.x (strict mode)
