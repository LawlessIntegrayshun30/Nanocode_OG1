# Nanocode v1.0 (Open Source Orchestration Framework)

Nanocode v1.0 is an open-source local orchestration framework for constraint-governed, model-agnostic AI workflows. It provides a structured way to apply constraints, recovery strategies, and certification artifacts to AI calls. This repository is intentionally **not** a sovereign kernel and does not include any closed Nanocode v2 kernel components.

## What this repository includes
- Constraint engine (framework-level): constraint profiles, policy gating, and structured prompt templates.
- Recovery (“tragedy”) strategies: bounded fallback/degrade/retry patterns for predictable behavior.
- Certification artifacts: run traces describing which constraints were applied, waived, or failed.
- Model adapters: OpenAI, Anthropic, and custom HTTP backends to keep workflows portable.
- Local stack: FastAPI backend + model server layer + frontend playground UI + dev scripts.

## What this repository explicitly does NOT include (Non-Goals)
Nanocode v1.0 does **not** provide:
- A closed or sovereign execution kernel
- Self-modifying instruction graphs or autonomous mutation
- Persistent internal identity/state beyond explicit external storage you configure
- Kernel-level rule authority independent of the user’s runtime configuration
- Any v2.0 production kernel components

If a feature requires kernel sovereignty (persistent internal state, autonomous rule enforcement, or self-modifying execution), it belongs to **Nanocode v2** and is out of scope for this repo.

## Relationship to Nanocode v2.0
- **Nanocode v1.0 (this repo):** open-source orchestration framework and reference implementation.
- **Nanocode v2.0 kernel:** proprietary, closed-source kernel not distributed here.

This separation is intentional and enforced to prevent licensing ambiguity and architectural drift.

## Prerequisites
- Python 3.10+ (or the version used by this project)
- Node.js 20.19+ (for the frontend) and npm
- Git
- (Optional) a Python virtual environment
- An API key for at least one model provider:
  - OpenAI (e.g. gpt-4o)
  - Anthropic
  - Or a compatible custom model server

## Quickstart
```bash
git clone https://github.com/<your-org>/nanocode-local-main.git
cd nanocode-local-main

# Backend dependencies
python3 -m pip install -r requirements.txt

# Frontend dependencies
cd frontend && npm install && cd ..
```

Configure providers (from repo root):
```bash
./configure_nanocode.sh
```
The script will create `.env` (from `.env.example`), prompt for OpenAI/Anthropic/Custom, and write credentials and model names.

Start everything locally:
```bash
./dev.sh
```
This starts the model server (port 9000), Nanocode API (port 8000), and frontend dev server (port 5173). Open http://localhost:5173 to experiment with constraints, workflows, and responses. Stop with `CTRL+C`.

Run the frontend only (optional):
```bash
cd frontend
npm install
npm run dev
```

### Optional: manual `.env`
```bash
cp .env.example .env
# edit with your keys/models
```
`.env` is ignored by Git and should never be committed.

### Build frontend for production (optional)
```bash
cd frontend
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```
Then open http://localhost:4173.

## Architecture at a Glance
- **Orchestration framework**: constraints, policy gating, tragedy strategies, and certification artifacts to bound agent behavior.
- **Model adapters**: swap between OpenAI, Anthropic, or custom backends without changing workflows.
- **Frontend playground**: experiment with constraints and workflows in-browser.
- **CLI/scripts**: `configure_nanocode.sh` for setup and `dev.sh` for a full local stack.

## Whitepaper
See [WHITEPAPER.md](WHITEPAPER.md) for design goals and the Nanocode v1.0 open source scope.

## License
Nanocode v1.0 is released under the Apache License 2.0. See `LICENSE` for terms and `NOTICE` for attribution details.

## Security Notes
- Never commit `.env` or any API keys to source control.
- Review `configure_nanocode.sh` to understand how your `.env` is written.
- When using remote model providers (OpenAI, Anthropic), ensure your usage complies with their terms.
