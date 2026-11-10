# Doc: https://docs.copilotkit.ai/google-antigravity/shared-state/agent-readonly (app_context.py)
from agents._common import build  # HARNESS: the doc's app_context.py calls build() but never imports it (agents._common is unpublished; harness copy from showcase).

# --- Doc (verbatim) ---
SYSTEM_PROMPT = (
    "You are a helpful, concise assistant. The app shares read-only context "
    "about the user (e.g. name, timezone, recent activity). Call "
    "`get_app_context` before every answer to read the latest values, then "
    "consult them when they are relevant: address the user by name if "
    "known, respect their timezone when mentioning times, and reference "
    "recent activity when it helps you answer. Keep responses short."
)


def app_context_agent():
    return build(system_instructions=SYSTEM_PROMPT, experimental_app_context=True)
# --- end doc ---
