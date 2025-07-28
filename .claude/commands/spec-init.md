---
description: Initialize a spec scaffold under specs/<domain>-<feature>-<id>/v1.0
allowed-tools: Bash(mkdir:*), Bash(bash:*), Bash(touch:*), Bash(sh:*)
argument-hint: "<domain>-<feature>-<id>"
---

## Context
Creating scaffold for: $ARGUMENTS

## Actions
!`bash -lc '
set -e
base="specs/$ARGUMENTS/v1.0"
mkdir -p "$base"
cat > "$base/requirements.md" <<EOF
# Requirements — <Feature>

## Out-of-Scope
- TBD

## R-1 Example requirement
EN: WHEN <condition>, THE SYSTEM SHALL <behavior>.
ZH: 当 <条件> 时，系统应 <行为>。

Acceptance:
- <measurable criteria>
- Negative: <negative case>
EOF

cat > "$base/design.md" <<EOF
# Design

## Context & Components
- TBD

## Sequence (Mermaid)
sequenceDiagram
  participant A as Actor
  participant S as System
  A->>S: Trigger
  S-->>A: Response

## Constraints & Observability
- TBD

## Risks
- TBD

## Rollback
- TBD

## Alternatives
- TBD
EOF

cat > "$base/tasks.md" <<EOF
# Tasks — <Feature>

- [ ] T-1 Example task
  Trace: R-1
  Owner: @owner
  Timebox: 1d
  Steps:
    - Step 1
  Done:
    - Unit test
EOF

cat > "$base/adr.md" <<EOF
# ADR-$(date +%F) Example ADR
Context:
- TBD

Decision:
- TBD

Alternatives:
- TBD

Consequences:
- TBD

Links:
- R-1
EOF

cat > "$base/changelog.md" <<EOF
## v1.0 — $(date +%F)
- Initial spec created

### Metrics Baseline
- Spec→PR First Pass: N/A
- Avg Rounds: N/A
- Lead Time: N/A
- Defects/Rollback: N/A
EOF
'`