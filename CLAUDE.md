# Antigravity-react

Docs QA harness for CopilotKit + Google Antigravity, React: https://docs.copilotkit.ai/google-antigravity. One route per doc page, doc code verbatim, one clip per page. The goal is to show doc defects; fixes that hide one are banned. Overview, layout and pipeline: [README.md](README.md).

## Rules

`.qa/` is the vendored copy of the shared tooling and rules (filled by the sync script; never edit it here).

@.qa/instructions/QA-RULES.md
@.qa/instructions/AUTORECORDER.md
@.qa/instructions/VOICE.md
@.qa/instructions/REVIEW.md
@.qa/instructions/REPORT.md

## This repo

- Ports: frontend **3040** (Next.js, runtime at `/api/copilotkit`), Python agents (FastAPI + uvicorn via `uv`): **8040** quickstart (`main.py`), **8041** interrupt, **8042** shared state, **8043** sub-agents, **8044** tool rendering, **8045** state rendering. Never 3000 / 8000; the frontend reaches the agent through the doc's own `AGENT_URL`.
- Antigravity-vue now runs its own copy of the quickstart agent (8141) and no longer needs this repo.
- Keys: `backend/.env` and `reference/starter/.env` (`GEMINI_API_KEY`; the SDK ignores `GOOGLE_API_KEY`), `frontend/.env.local` (`AGENT_URL`). Names in [.env.example](.env.example). Never print or commit them.
- The doc's `.env` is never loaded by the backend (FINDINGS #1), so `start-all.sh` passes it with `uv run --env-file .env`. That is a HARNESS workaround; the finding stands.
- `reference/` is upstream code, read-only, never edited: `reference/starter/` is the CopilotKit <> Google Antigravity starter template (Next.js + Python agent), kept to compare against the doc; `reference/showcase/` is the CopilotKit showcase source, used to confirm what a page leaves out.
- The Next dev overlay error from `Date.now()` in `CopilotKitProvider` (FINDINGS #4) is a doc finding. Never hide it.
- **The 2026-11-04 clips must be re-recorded**: `autorecorder/actions/antigravity.actions.ts` (`FINDING_NOTES` / `writeFinding`) draws red outlines and captions on the page, which REVIEW.md treats as `rerecord`. Use the LangGraph-style evidence step (drag-select + Notepad, `actions/doc-evidence.ts`). `Antigravity-reupload/` holds local re-takes (not committed).
- Findings from the 2026-11-04 assignment were logged directly (one-off exception, QA-RULES section 6). New findings are approved by the owner locally.
- Recorder: `autorecorder/` (`npm run record -- --pages=<id>`, `record:list`, `doctor`). `autorecorder/core/` is frozen, see `autorecorder/CLAUDE.md`. Clips go to `autorecorder/videos/` (not committed).
- Report rows use the team doc's older Antigravity `status` style (`assignment.json` `report.style`), not REPORT.md's `team` style, until the owner switches it.
