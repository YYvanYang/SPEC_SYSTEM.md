---
description: Initializes new feature specification structure with templates
argument-hint: <feature-name>
allowed-tools: Write, LS, Bash
---

You are initializing a new feature specification for "$ARGUMENTS".

Create the following directory structure:

```
specs/features/$ARGUMENTS/
├── v1.0/
│   ├── requirements.md    # EARS requirements template
│   ├── design.md         # Technical design template
│   ├── tasks.md          # Implementation tasks template
│   ├── adr.md           # Architecture decisions template
│   ├── test-plan.md     # Testing strategy template
│   └── changelog.md     # Version history
└── metrics.md           # Feature metrics tracking
```

Create each file with appropriate templates:
- **Requirements**: EARS format structure with acceptance criteria
- **Design**: Component diagrams, API specs, data models
- **Tasks**: Task breakdown with dependencies and estimates
- **ADR**: Architecture decision record format
- **Test Plan**: Test strategy with scenarios and coverage
- **Changelog**: Version tracking and release notes
- **Metrics**: Success metrics and KPIs

This ensures consistent specification structure and traceability from requirements to implementation.