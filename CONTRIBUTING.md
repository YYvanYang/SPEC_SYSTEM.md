# Contributing to SPEC_SYSTEM

Welcome to the AI-native spec-driven development project! This guide will help you contribute effectively using our specialized agent system.

## 🎯 Contributing Philosophy

We use **AI agents for everything** - from planning to implementation to review. Your contributions should follow our spec-driven approach:

1. **Always start with specs** - Use `/plan-feature` for new features
2. **Follow EARS format** - All requirements must be testable
3. **Agent-first workflows** - Let specialized agents guide your work
4. **Quality gates first** - Never bypass automated quality checks

## 🚀 Quick Start for Contributors

### 1. Set Up Your Environment

```bash
# Clone and set up
git clone <repository-url>
cd SPEC_SYSTEM
npm install

# Verify agent system is working
/analytics-dashboard
```

### 2. Plan Your Contribution

For **new features**:
```bash
/plan-feature your-feature-name
```

For **bug fixes**:
```bash
/spec-init bug-fix-feature-name
```

For **improvements**:
```bash
/plan-feature improvement-feature-name
```

### 3. Follow the Agent Workflow

The system will guide you through:

1. **@steering-architect** - Strategic approach
2. **@feature-planner** - Task breakdown  
3. **@requirements-engineer** - EARS requirements
4. **@design-architect** - Technical design
5. **@implementation-specialist** - Code implementation
6. **@test-strategist** - Comprehensive testing
7. **@quality-guardian** - Quality review
8. **@documentation-curator** - Documentation updates

## 📋 Contribution Types

### Feature Contributions

**Process:**
1. Create feature spec: `/plan-feature feature-name`
2. Implement tasks: `/implement-task task-id`
3. Review ready: `/review-ready feature-name`
4. Submit PR with agent-generated documentation

**Requirements:**
- [ ] EARS-compliant requirements
- [ ] Complete technical design
- [ ] Test coverage ≥ 80%
- [ ] Documentation updated
- [ ] Quality gates passing

### Bug Fix Contributions

**Process:**
1. Document the bug with reproduction steps
2. Create fix spec: `/spec-init bug-fix-name`
3. Implement minimal fix: `/implement-task fix-task-id`
4. Verify fix with comprehensive tests
5. Review ready: `/review-ready bug-fix-name`

**Requirements:**
- [ ] Root cause analysis documented
- [ ] Minimal, targeted fix
- [ ] Regression tests added
- [ ] No breaking changes

### Agent System Contributions

**Special Process for Core System:**
1. **Requires Architecture Approval**: Use `/review-architecture-change`
2. **Protected Paths**: Changes to `.claude/` require special approval
3. **Impact Assessment**: Must analyze impact on all agents
4. **Backward Compatibility**: Maintain compatibility with existing workflows

### Documentation Contributions

**Handled by @documentation-curator:**
- API documentation updates
- User guide improvements
- Architecture decision records
- Runbook updates

## 🛡️ Quality Standards

### Code Quality

**Enforced by @quality-guardian:**
- [ ] Follows established code patterns
- [ ] Comprehensive error handling
- [ ] Appropriate logging and observability
- [ ] Security best practices
- [ ] Performance considerations

### Testing Requirements

**Managed by @test-strategist:**
- [ ] Unit tests for all new functions
- [ ] Integration tests for API changes
- [ ] End-to-end tests for user-facing features
- [ ] Performance tests for critical paths
- [ ] Security tests for sensitive operations

### Documentation Standards

**Curated by @documentation-curator:**
- [ ] All public APIs documented
- [ ] Code comments for complex logic
- [ ] Architecture decisions recorded (ADRs)
- [ ] User-facing changes in changelog
- [ ] Examples working and current

## 🔄 Review Process

### Automated Reviews

**Pre-merge Quality Gates:**
- Static analysis and linting
- Security vulnerability scanning  
- Test suite execution
- Performance regression testing
- Documentation completeness check

### Agent Reviews

**@quality-guardian performs:**
- Code quality and security review
- Performance impact analysis
- Compliance and governance checks
- Risk assessment and mitigation

**Output Format:**
- **MUST**: Blocking issues that prevent merge
- **SHOULD**: Important improvements recommended  
- **NICE**: Optional enhancements for future consideration

### Human Reviews

Required for:
- Architecture changes
- Security-sensitive modifications
- Breaking changes
- New agent definitions

## 📊 Metrics & Feedback

### Contribution Metrics

We track:
- **Cycle Time**: Spec creation to merge
- **First-Pass Success**: No rework needed
- **Quality Score**: Automated quality assessment
- **Impact Score**: Business value delivered

### Feedback Loops

- **Real-time**: Quality gate failures
- **Daily**: Delivery metrics summary
- **Weekly**: Contribution impact analysis
- **Monthly**: Process improvement recommendations

## 🚫 What NOT to Do

### Anti-Patterns

- **Bypass Quality Gates**: Never disable or skip automated checks
- **Vague Requirements**: Avoid non-EARS format requirements
- **Large Diffs**: Break changes into smaller, focused pieces
- **Undocumented Changes**: Always update relevant documentation
- **Manual Processes**: Use agents instead of manual workflows

### Blocking Issues

These will prevent your contribution from being accepted:
- Quality gates failing
- Missing test coverage
- Security vulnerabilities
- Breaking changes without approval
- Incomplete documentation

## 🎓 Learning Resources

### Agent Guides

- **Strategic Agents**: `.claude/agents/steering-architect.md`
- **Execution Agents**: `.claude/agents/implementation-specialist.md`
- **Quality Agents**: `.claude/agents/quality-guardian.md`

### Workflow Examples

- **Feature Development**: See `specs/features/example-feature/`
- **Quality Processes**: Review `.claude/workflows/quality-gates.yml`
- **Analytics Usage**: Check `/analytics-dashboard` output

### Standards Reference

- **Coding Standards**: `specs/standards/coding-standards.md`
- **Testing Guidelines**: `specs/standards/testing-standards.md`
- **Documentation Guide**: `specs/standards/documentation-guide.md`

## 🤝 Community

### Getting Help

1. **Check Analytics**: `/analytics-dashboard` for system health
2. **Review Workflows**: `.claude/workflows/` for process guidance
3. **Ask Agents**: Use agent-specific questions for domain expertise
4. **Community Issues**: GitHub issues for broader questions

### Communication Channels

- **Feature Discussions**: GitHub Discussions
- **Bug Reports**: GitHub Issues with reproduction steps
- **Architecture Proposals**: Use `/review-architecture-change`
- **General Questions**: Community Discord/Slack

## 📈 Recognition

### Contributor Metrics

Tracked automatically:
- Features delivered
- Quality contributions
- Knowledge sharing
- Process improvements

### Recognition Program

- **Quality Champion**: Consistent high-quality contributions
- **Innovation Award**: Novel use of agent system
- **Community Builder**: Excellent documentation and help
- **Technical Leader**: Architecture and system improvements

---

## Ready to Contribute?

1. **Start with Planning**: `/plan-feature your-contribution`
2. **Follow Agent Guidance**: Let the system guide your workflow
3. **Quality First**: Never bypass quality gates
4. **Learn Continuously**: Use analytics to improve your process

**Welcome to the future of development!** 🚀