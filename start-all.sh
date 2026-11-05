#!/usr/bin/env bash
# HARNESS: starts every Antigravity-react server on its harness port (REPOS.md: never 3000/8000).
#   8040 quickstart agent (main.py)      8041 experimental_interrupt agent
#   8042 shared-state agent              8043 sub-agents supervisor     8044 tool-rendering agent
#   3040 Next.js frontend (runtime at /api/copilotkit)
# Backends use --env-file because the doc's .env is never loaded (FINDINGS.md #1).
cd "$(dirname "$0")"
mkdir -p logs
(cd backend && uv run --env-file .env uvicorn main:app --port 8040 > ../logs/backend-8040.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn interrupt_main:app --port 8041 > ../logs/backend-8041.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn shared_state_main:app --port 8042 > ../logs/backend-8042.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn subagents_main:app --port 8043 > ../logs/backend-8043.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn tool_rendering_main:app --port 8044 > ../logs/backend-8044.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn state_rendering_main:app --port 8045 > ../logs/backend-8045.log 2>&1) &
(cd frontend && npm run dev > ../logs/frontend-3040.log 2>&1) &
wait
