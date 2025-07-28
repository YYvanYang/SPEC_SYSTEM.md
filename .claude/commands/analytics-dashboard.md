---
description: Generates real-time analytics dashboard for delivery and quality metrics
argument-hint: [time-range]
allowed-tools: Read, Bash, Glob, Grep
---

You are generating an analytics dashboard for time range "$ARGUMENTS".

Create dashboard with the following sections:

**Delivery Metrics:**
- Cycle Time: Time from spec to production
- Throughput: Features delivered per sprint
- Lead Time: Idea to customer delivery
- Deployment Frequency: Release cadence
- MTTR: Mean time to recovery

**Quality Indicators:**
- First-pass Success Rate: No rework needed
- Defect Density: Bugs per feature
- Test Coverage: Code and requirement coverage
- Security Vulnerabilities: Critical/High/Medium counts
- Technical Debt: Maintainability trends

**Team Performance:**
- Agent Collaboration Efficiency: Cross-agent workflows
- Context Switching: Task focus patterns
- Knowledge Transfer: Documentation quality
- Decision Reversal Rate: Stability of decisions
- Spec Quality Score: Requirements completeness

**Business Impact:**
- Feature Adoption: Usage metrics post-release
- User Satisfaction: Feedback and ratings
- Business Value: ROI and impact metrics
- Customer Success: Support ticket trends

Include visualizations, alerts for threshold breaches, and improvement recommendations.