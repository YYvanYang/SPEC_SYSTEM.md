---
description: Orchestrates complete feature planning through strategic agents collaboration
argument-hint: <feature-name>
allowed-tools: Task, Read, Write, Glob, Grep
---

You are coordinating a multi-agent feature planning workflow for the feature "$ARGUMENTS".

Execute the following sequence using the Task tool with appropriate sub-agents:

1. Use steering-architect to define technical approach and strategy
2. Use feature-planner to break down work packages 
3. Use requirements-engineer to create EARS requirements
4. Use design-architect to design system components
5. Use test-strategist to plan testing approach

Create complete feature specification in `specs/features/$ARGUMENTS/v1.0/`:
- requirements.md - EARS requirements
- design.md - Technical design  
- tasks.md - Implementation tasks
- adr.md - Architecture decisions
- test-plan.md - Testing strategy