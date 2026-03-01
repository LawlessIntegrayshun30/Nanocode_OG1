# Nanocode v1.0 — Open-Source Observation & Orchestration Framework

## Overview
Nanocode v1.0 is an open-source observation and orchestration framework for AI workflows where constraints, recovery strategies, and execution traces are first-class. It standardizes how you define "what must be true" (constraints), "what to do when it isn't" (recovery), and "what happened" (execution traces), while remaining model-agnostic and governance-agnostic.

## Design Goals
- **Resilience-first:** bounded recoveries (fallback / degrade / retry) to keep workflows predictable.
- **Model-agnostic:** adapters decouple orchestration logic from providers (OpenAI, Anthropic, custom HTTP).
- **Observable execution:** produce traces showing which constraints were applied, waived, or failed.
- **Human-auditable:** structured prompts, traces, and logs to simplify debugging and review.
- **Local-first:** runs in a local stack; behavior is controlled by configuration and code you can inspect.

## Explicit Non-Goals (v1.0 will not include)
- Governance, policy enforcement, or control mechanisms
- Self-modifying instruction graphs (autonomous mutation)
- Persistent internal identity/state as an intrinsic property of the system
- Any Cham-Code production components

Governance and enforcement features are intentionally out of scope; contributors who need these should implement them as optional extensions or forks.

## Architecture (v1.0 scope)
- **Constraint Layer (framework-level):** constraints, templates, and profile loading.
- **Recovery ("Tragedy") Strategies:** bounded behaviors when constraints cannot be satisfied.
- **Execution Traces:** artifacts recording constraint status and workflow outcomes for post-run analysis.
- **Model Adapters:** normalized provider integrations to keep workflows portable.
- **Execution Runtime:** API + local services for orchestration, trace collection, and UX.

## Conceptual Execution Flow
1) Define a workflow and its constraints.
2) Orchestration applies constraints and selects an adapter.
3) If constraints fail, apply bounded recovery strategies (degrade, fallback, safe stop).
4) Emit execution traces recording what happened and why.
5) Surface results and traces for review through API/UI.

## Relationship to Nanocode v2 / Cham-Code
- **v1.0:** open-source observation and orchestration framework (this repository).
- **v2.0:** separate proprietary product; not distributed or integrated here.

This separation maintains architectural clarity and licensing independence.

## Open Source Release (Nanocode v1.0)
Nanocode v1.0 includes:
- Orchestration concepts: constraint language, tragedy strategies, and certification semantics.
- Model adapters for OpenAI, Anthropic, and custom HTTP integrations (additional adapters may ship as stubs depending on provider availability).
- FastAPI API, model server layer, frontend playground, and CLI/scripts for local development.
- Example configuration via `.env.example` and `configure_nanocode.sh`.

This release focuses on transparency and extensibility; future commercial distributions may add enterprise packaging or managed services, but those are outside the scope of v1.0.

## Roadmap Signals
- Broader adapter coverage (additional model providers and evaluation harnesses).
- Richer execution trace artifacts and export formats.
- Improved observability, debugging, and developer experience.

## License
Nanocode v1.0 is released under the Apache License 2.0. See `LICENSE` for terms and `NOTICE` for attribution details.
