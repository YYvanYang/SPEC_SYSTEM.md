# /implement-task - Implementation Workflow

Executes structured implementation workflow with quality assurance.

## Usage
```
/implement-task <task-id>
```

## Workflow
Executes the following agent sequence:

1. **@implementation-specialist** - Codes the solution
   - Reads and understands complete requirement
   - Designs minimal solution meeting all criteria
   - Implements with proper error handling and logging
   - Makes targeted, minimal changes

2. **@test-strategist** - Runs comprehensive tests
   - Executes unit, integration, and e2e tests
   - Validates against acceptance criteria
   - Reports test coverage and quality metrics
   - Identifies any test failures or gaps

3. **@quality-guardian** - Reviews for quality/security
   - Performs code quality and security review
   - Analyzes performance impact
   - Checks compliance and governance
   - Provides MUST/SHOULD/NICE feedback

4. **@documentation-curator** - Updates documentation
   - Updates relevant technical documentation
   - Ensures consistency across all docs
   - Validates documentation against implementation
   - Updates API specs and runbooks

## Prerequisites
- Task must exist in `specs/features/<feature>/tasks.md`
- Requirements must be in EARS format
- Design specifications must be complete

## Output
- Implemented code changes
- Updated test suite
- Quality review report
- Updated documentation