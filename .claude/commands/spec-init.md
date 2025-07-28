# /spec-init - Spec Initialization

Initializes new feature specification structure with templates.

## Usage
```
/spec-init <feature-name>
```

## What it does
Creates complete feature specification structure:

```
specs/features/<feature-name>/
├── v1.0/
│   ├── requirements.md    # EARS requirements template
│   ├── design.md         # Technical design template
│   ├── tasks.md          # Implementation tasks template
│   ├── adr.md           # Architecture decisions template
│   ├── test-plan.md     # Testing strategy template
│   └── changelog.md     # Version history
└── metrics.md           # Feature metrics tracking
```

## Templates include
- **Requirements**: EARS format structure with acceptance criteria
- **Design**: Component diagrams, API specs, data models
- **Tasks**: Task breakdown with dependencies and estimates
- **ADR**: Architecture decision record format
- **Test Plan**: Test strategy with scenarios and coverage
- **Changelog**: Version tracking and release notes
- **Metrics**: Success metrics and KPIs

## Benefits
- Consistent specification structure
- No missing documentation sections
- Built-in quality checkpoints
- Traceability from requirements to implementation