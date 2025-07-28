# /review-ready - Comprehensive Review

Triggers comprehensive multi-agent review process before merge.

## Usage
```
/review-ready [feature-name]
```

## Workflow
Executes parallel review processes:

### Automated Quality Checks
- Lint checks and code formatting
- Unit and integration test execution
- Security vulnerability scanning
- Performance regression testing

### Agent Reviews

1. **@quality-guardian** - Deep quality review
   - Code quality and security analysis
   - Performance impact assessment
   - Compliance and governance verification
   - Risk assessment and mitigation

2. **@metrics-analyst** - Delivery metrics tracking
   - Tracks cycle time and throughput
   - Measures quality indicators
   - Analyzes team collaboration patterns
   - Updates delivery dashboards

3. **@documentation-curator** - Documentation verification
   - Validates documentation completeness
   - Ensures consistency across all docs
   - Checks for broken links and references
   - Verifies examples and code samples

4. **@test-strategist** - Test completeness review
   - Validates test coverage against requirements
   - Ensures all edge cases are covered
   - Reviews test quality and effectiveness
   - Confirms acceptance criteria validation

## Quality Gates
All must pass before merge approval:

- [ ] All automated tests pass
- [ ] Security scan shows no critical issues
- [ ] Performance benchmarks within thresholds
- [ ] Code quality meets standards
- [ ] Documentation is complete and accurate
- [ ] All requirements have test coverage

## Output
- Comprehensive review report
- Quality gate status
- Recommendations for improvement
- Merge approval or blocking issues