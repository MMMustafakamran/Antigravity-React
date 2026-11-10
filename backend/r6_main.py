# HARNESS: neither the tool-based page nor the agent-readonly page shows a server; wired like the
# quickstart main.py. One process on :8061 serves both doc agents on sub-paths.
from ag_ui_antigravity import create_antigravity_app

from agents.app_context import app_context_agent
from agents.gen_ui_tool_based import gen_ui_tool_based_agent

app = create_antigravity_app(
    {"/tool-based": gen_ui_tool_based_agent(), "/app-context": app_context_agent()}, path="/"
)
