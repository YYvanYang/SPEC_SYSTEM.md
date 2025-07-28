# /plan-feature - Multi-Agent Feature Planning

Orchestrates complete feature planning through strategic agents collaboration.

## Usage
```
/plan-feature <feature-name>
```

## Workflow
Executes the following agent sequence:

1. **@steering-architect** - Defines technical approach and strategy
   - Analyzes business requirements and technical constraints
   - Identifies high-level risks and dependencies
   - Establishes architecture principles for the feature

2. **@feature-planner** - Breaks down work packages
   - Decomposes feature into 0.5-2 day tasks
   - Identifies dependencies and sequencing
   - Estimates effort and timeline

3. **@requirements-engineer** - Creates EARS requirements
   - Transforms vague requirements into precise EARS format
   - Defines acceptance criteria and test scenarios
   - Ensures testability and completeness

4. **@design-architect** - Designs system components
   - Creates technical architecture and component design
   - Documents integration patterns and API specs
   - Produces ADRs for key decisions

5. **@test-strategist** - Plans testing approach
   - Designs comprehensive test strategy
   - Creates test scenarios for all paths
   - Defines quality gates and metrics

## Output
Creates complete feature specification in `specs/features/<feature-name>/v1.0/`:
- `requirements.md` - EARS requirements
- `design.md` - Technical design
- `tasks.md` - Implementation tasks
- `adr.md` - Architecture decisions
- `test-plan.md` - Testing strategy