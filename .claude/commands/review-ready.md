---
description: Triggers comprehensive multi-agent review process before merge
argument-hint: [feature-name]
allowed-tools: Task, Bash, Read, Glob, Grep
---

You are conducting a comprehensive review for "$ARGUMENTS" before merge.

Execute parallel review processes:

**Automated Quality Checks:**
- Run lint checks and code formatting
- Execute unit and integration tests
- Perform security vulnerability scanning
- Run performance regression testing

**Agent Reviews:**
1. Use quality-guardian for deep quality review
2. Use metrics-analyst for delivery metrics tracking
3. Use documentation-curator for documentation verification
4. Use test-strategist for test completeness review

**Quality Gates (all must pass):**
- All automated tests pass
- Security scan shows no critical issues
- Performance benchmarks within thresholds
- Code quality meets standards
- Documentation is complete and accurate
- All requirements have test coverage

Provide comprehensive review report, quality gate status, and merge approval recommendation.