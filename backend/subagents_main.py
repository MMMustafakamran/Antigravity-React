# HARNESS: the subagents page shows the agent module but no app. Wired like the quickstart main.py.
from ag_ui_antigravity import create_antigravity_app

from agents.subagents import subagents_agent

app = create_antigravity_app(subagents_agent(), path="/")
