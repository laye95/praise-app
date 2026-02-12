# Code Review (Deep)

## Goal

Perform a thorough review to verify correctness, maintainability, security, and
operational readiness before approving. Prioritize issues by risk and provide
actionable fixes.

## Required Output Format

1. Summary of change (3–6 bullets)
2. Scope (files/components touched + what’s not covered)
3. Verdict: ✅ Approve / ❌ Request changes
4. Findings (prioritized):
   - [Blocker|High|Medium|Low] <title>
     - Location: file:line (or file/function)
     - Why it matters (impact + likelihood)
     - Recommendation (specific fix)
     - If relevant: example patch/pseudocode
5. Tests:
   - Existing coverage assessment
   - Missing tests (at least 5 concrete test cases with inputs/expected outcomes)
6. Security:
   - Threat model: entry points + trust boundaries + sensitive assets
   - Validation/sanitization, authn/authz, secrets/logging, dependency risks
7. Performance & Reliability:
   - Complexity changes, hot paths, I/O/db/network impact, caching
   - Failure modes, retries/timeouts, idempotency, rate limiting
8. Maintainability:
   - API/contract compatibility, readability, naming, duplication
   - Suggested refactors (smallest safe changes first)
9. Observability & Ops:
   - Logs/metrics/traces, error messages, correlation IDs
   - Config/migrations/rollout/rollback considerations

## Steps

1. Understand the change
   - Restate intent and success criteria
   - Note assumptions and unknowns to clarify with author
2. Validate functionality
   - Confirm behavior matches requirements
   - Walk through edge cases and error paths
   - Verify inputs/outputs and invariants
3. Assess quality & design
   - Clear responsibilities, minimal coupling, good naming
   - Remove duplication/dead code, keep functions focused
4. Security & risk review
   - Identify injection/traversal/deserialization risks
   - Validate user-controlled data handling
   - Confirm no secrets exposed (logs, configs, telemetry)
5. Tests & docs
   - Confirm tests updated; propose missing tests
   - Ensure docs/comments match new behavior

## Review Checklist

### Functionality

- [ ] Matches stated intent and success criteria
- [ ] Edge cases handled gracefully
- [ ] Errors are informative and correctly surfaced

### Code Quality

- [ ] Clear structure, readable, maintainable
- [ ] No unnecessary duplication/dead code
- [ ] Backward compatibility considered (API/behavior)

### Security & Safety

- [ ] Inputs validated; outputs safely encoded/sanitized
- [ ] Authn/authz correct for new/changed behavior
- [ ] No sensitive data leaks (logs/metrics/traces)
- [ ] Dependency changes reviewed (licenses/supply chain)

### Performance & Reliability

- [ ] No obvious regressions (N+1, extra I/O, large allocations)
- [ ] Timeouts/retries/idempotency considered where relevant
- [ ] Resource management is correct (files, connections, goroutines/threads)

### Observability & Ops

- [ ] Logging/metrics/tracing sufficient for debugging
- [ ] Rollout/rollback/migrations handled if needed
