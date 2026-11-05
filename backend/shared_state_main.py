# HARNESS: shared-state page, backend. The doc snippets are verbatim; the imports and build()
# replacement are harness (build comes from agents._common, unpublished: FINDINGS.md #8).
import os

from ag_ui_antigravity import (  # HARNESS: the doc's set_notes snippet uses these but never imports them
    AntigravityAgent,
    create_antigravity_app,
    experimental_get_state,
    experimental_set_state,
)

# --- Doc: https://docs.copilotkit.ai/google-antigravity/shared-state (verbatim) ---
READ_WRITE_PROMPT = (
    "You are a helpful, concise assistant. Call `get_shared_state` before "
    "every answer. Its `preferences` object holds the user's name, preferred "
    "tone, language and interests, which the user edits in the app: always "
    "respect them, and address the user by name when you know it. Its "
    "`notes` list holds what you have remembered so far. "
    "When the user asks you to remember something, or when you observe "
    "something worth surfacing in the UI, call `set_notes` with the FULL "
    "updated list of short note strings (existing notes + new)."
)


def set_notes(notes: list[str]) -> str:
    """Replace the notes array in shared state with the full updated list.

    Use this tool whenever the user asks you to "remember" something, or
    when you have an observation about the user worth surfacing in the
    UI's notes panel. Always pass the FULL notes list (existing notes +
    any new ones), not a diff. Keep each note short (< 120 chars).
    """
    experimental_set_state({**experimental_get_state(), "notes": notes})
    return "Notes updated."
# --- end doc ---

# HARNESS: stands in for the doc's build(system_instructions=..., tools=[set_notes], experimental_app_state=True)
agent = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    system_instructions=READ_WRITE_PROMPT,
    tools=[set_notes],
    experimental_app_state=True,
    workspaces=["/srv/agents/w1"],
)
app = create_antigravity_app(agent, path="/")
