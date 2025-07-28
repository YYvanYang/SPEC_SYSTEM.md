---
description: Executes structured implementation workflow with quality assurance
argument-hint: <task-id>
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

You are executing an implementation workflow for task "$ARGUMENTS".

Execute the following sequence using the Task tool with appropriate sub-agents:

1. Use implementation-specialist to code the solution
   - Read and understand complete requirement
   - Design minimal solution meeting all criteria
   - Implement with proper error handling and logging

2. Use test-strategist to run comprehensive tests
   - Execute unit, integration, and e2e tests
   - Validate against acceptance criteria
   - Report test coverage and quality metrics

3. Use quality-guardian to review for quality/security
   - Perform code quality and security review
   - Analyze performance impact
   - Provide MUST/SHOULD/NICE feedback

4. Use documentation-curator to update documentation
   - Update relevant technical documentation
   - Ensure consistency across all docs
   - Validate documentation against implementation

Prerequisites: Task must exist in specs/features/<feature>/tasks.md with EARS requirements and complete design specifications.