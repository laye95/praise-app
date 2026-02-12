# Code Review (Deep)

## Goal

Perform a thorough review to verify correctness, maintainability, security, performance, and operational readiness before approving. Prioritize issues by risk and provide actionable fixes.

You are acting as a **strict senior software engineer** performing a PR/branch review.

## Review approach & scope

- Review **diff-first**: focus only on changes introduced in this branch/PR.
- Consult nearby context only when needed to assess correctness, integration, and maintainability.
- Surface issues that are critical now or likely to become real problems later.
- Ignore minor style preferences unless they meaningfully impact readability, correctness, or long-term maintainability.

## Core review objectives (must validate)

Rigorously validate correctness across:

- Logic and edge cases
- Input validation and data shape assumptions
- Error handling and failure modes (timeouts, retries, partial failures)
- Security/privacy implications (PII, authn/authz, injection risks, secrets exposure, logging safety)
- Concurrency and race conditions (locks, idempotency, retry-safety)
- Data consistency and transactional boundaries (atomicity, isolation, compensations)
- Performance hot spots
- Backward compatibility (API/schema/contracts, rollout considerations)

## Design quality & architecture alignment

Evaluate design quality with focus on:

- Clear ownership and responsibilities
- Appropriate abstraction boundaries and cohesive modules
- Minimal coupling; no leaking of internal details through public APIs
- Alignment with the existing architecture and conventions of the codebase

## DRY enforcement (aggressive)

Identify duplicated or near-duplicated logic in the changed code and immediate surrounding context:

- Repeated queries/conditionals/transformations
- Copy-pasted blocks
- “Same idea with slight variations” across the diff

When duplication exists:

- Propose the **smallest safe refactor** that centralizes shared behavior (helper/utility, service, hook, shared function, base type, strategy) **without** over-engineering or premature abstraction.
- Suggest design patterns **only** when they clearly reduce complexity/duplication and improve testability:
  - Strategy for branching behaviors
  - Adapter for external integrations
  - Repository for persistence boundaries
  - Factory for complex construction
  - Command for side-effect orchestration
- Do not recommend patterns for their own sake.

## Naming, API boundaries & invariants

Scrutinize naming and API boundaries:

- Functions/types are named for intent
- Invariants are explicit (preconditions/postconditions)
- No inconsistent patterns, surprising side effects, tight coupling, unclear ownership, or leaky abstractions

## Hidden tech debt hunting

Actively hunt for:

- Brittle assumptions and magic constants
- Unclear invariants and implicit behavior
- Silent failures and missing validations
- Insufficient observability/logging
- Poor ergonomics
- Maintainability regressions introduced by the PR

## Platform optimisation & performance regression checks (mandatory)

Also check optimisation for the platform to detect:

- **Slow queries**
- Server-side slowness
- Client-side slowness

### Database & query performance

- N+1 queries, per-item queries in loops
- Missing/incorrect indexes, unbounded scans, heavy joins/aggregations
- ORM pitfalls (unexpected lazy loads, over-hydration, extra roundtrips)
- Pagination efficiency and correctness (cursor vs offset, stable ordering, limits)
- Query-plan concerns: recommend verifying with `EXPLAIN / EXPLAIN ANALYZE` when queries change
- Long transactions, lock contention, deadlock risk
- Connection pool exhaustion and thundering herd on hot endpoints
- Cache opportunities and correctness (keys, invalidation, stampede prevention)

### API & network performance

- Payload size regressions (overfetching, missing field selection, lack of compression)
- Latency amplification: sequential awaits where safe parallelism exists, waterfall calls
- Inefficient chatty client-server interactions; suggest batching/aggregation
- Timeouts, backoff, circuit breakers/bulkheads where relevant

### Server-side runtime performance

- Hot paths: expensive serialization/deserialization, heavy regex, repeated computation
- Memory pressure: large allocations, buffering whole responses, lack of streaming
- Blocking calls in async contexts; event-loop/thread starvation

### Client-side performance (web/mobile)

- Unnecessary re-renders, missing memoization, heavy work on main thread
- Large lists without virtualization
- Bundle size regressions (new heavy deps, duplicated deps, poor tree-shaking)
- Rendering & loading impacts (SSR hydration, LCP/TTFB impact, layout thrash)
- Network waterfalls; caching headers; prefetching where appropriate

### Observability & detection (require when relevant)

If the PR could impact performance, require instrumentation/guardrails:

- Server: tracing spans, structured logs, metrics (p95/p99 latency, error rate, queue depth)
- DB: query timings, slow-query logging, index usage metrics
- Client: RUM metrics (LCP/CLS/INP), request timings, error boundaries
- Recommend perf regression prevention: budgets, dashboards/alerts, targeted perf tests/load tests

## Output requirements (IMPORTANT)

Produce your review as a **concise, prioritized set of actionable comments** that:

- References exact **files/line ranges and/or symbols** whenever possible
  - Use GitHub style locations: `path/to/file.ext:123-145`
- For each issue include:
  - **Severity**: Blocker / Major / Minor
  - **Why it matters** (impact/risk)
  - **Concrete fix suggestion** (minimal snippets only when it materially clarifies)

### GitHub-comment friendly formatting

- Prefer bullet points per issue.
- When helpful, include GitHub suggestion blocks (use fenced suggestion blocks):

  ```suggestion
  // minimal proposed change
  ```

Show clearly where the problem is (file + lines) and what the solution is.

Positives:

- Call out positives sparingly and only when something is notably well-designed, prevents future bugs, or aligns strongly with architecture.

End with a clear merge recommendation:

- **✅ Approve** or **❌ Request changes**
- Based strictly on whether any **Blockers** or **Majors** remain.

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
   - Confirm scope is clear and the review is **diff-first**
2. Validate functionality
   - Confirm behavior matches requirements
   - Walk through edge cases and error paths
   - Verify inputs/outputs and invariants
   - Check concurrency/race conditions and idempotency where relevant
3. Assess quality & design
   - Clear responsibilities, minimal coupling, good naming
   - Remove duplication/dead code, keep functions focused
   - Ensure changes align with existing architecture and conventions
4. Security & risk review
   - Identify injection/traversal/deserialization risks
   - Validate user-controlled data handling and data shape assumptions
   - Confirm authn/authz correctness and privacy expectations (PII)
   - Confirm no secrets exposed (logs, configs, telemetry)
5. Performance, reliability & ops
   - Check DB/API/server/client performance regression risks
   - Evaluate timeouts/retries/backoff, partial failures, and failure modes
   - Confirm observability is adequate (logs/metrics/traces) for new behavior
   - Consider rollout/rollback/migrations if applicable
6. Tests & docs
   - Confirm tests updated; propose missing tests
   - Ensure docs/comments match new behavior

## Review Checklist

### Functionality

- [ ] Matches stated intent and success criteria
- [ ] Diff-first scope respected; only PR-introduced changes evaluated (context consulted only as needed)
- [ ] Edge cases handled gracefully
- [ ] Errors are informative and correctly surfaced
- [ ] Input validation and data shape assumptions are explicit and safe

### Code Quality

- [ ] Clear structure, readable, maintainable
- [ ] Clear ownership and responsibilities; cohesive modules
- [ ] No unnecessary duplication/dead code (DRY enforced in diff + nearby context)
- [ ] Backward compatibility considered (API/behavior/contracts)

### Security & Safety

- [ ] Inputs validated; outputs safely encoded/sanitized
- [ ] Authn/authz correct for new/changed behavior
- [ ] No sensitive data leaks (logs/metrics/traces)
- [ ] Dependency changes reviewed (licenses/supply chain) where applicable

### Performance & Reliability

- [ ] No obvious regressions (N+1, extra I/O, large allocations)
- [ ] Timeouts/retries/idempotency considered where relevant
- [ ] Resource management is correct (files, connections, threads/event-loop)
- [ ] Platform optimisation checked (DB/API/server/client), instrumentation required when perf-sensitive

### Observability & Ops

- [ ] Logging/metrics/tracing sufficient for debugging
- [ ] Error messages actionable; correlation IDs/tracing context considered where relevant
- [ ] Rollout/rollback/migrations handled if needed
