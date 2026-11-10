# HARNESS (R5): the A2UI dynamic/fixed, JSON Render, Hashbrown and Open Generative UI pages show
# their agent files in the Code tab but never the server that mounts them on the paths their
# route.ts files call (/declarative_gen_ui, /a2ui_fixed_schema, /declarative_json_render,
# /declarative_hashbrown, /open_gen_ui, /open_gen_ui_advanced). Wired like the quickstart main.py,
# one process on :8060. agents/_common.py (build) is unpublished too (copied from the showcase earlier).
# ag-ui-a2ui-toolkit (imported by agents/a2ui_dynamic.py) is not in any install step on the page;
# installed with `uv pip install ag-ui-a2ui-toolkit`, so start this with `uv run --no-sync`.
from ag_ui_antigravity import create_antigravity_app

from agents.a2ui_dynamic import declarative_gen_ui_agent
from agents.a2ui_fixed import a2ui_fixed_agent
from agents.byoc_hashbrown import byoc_hashbrown_agent
from agents.byoc_json_render import byoc_json_render_agent
from agents.open_gen_ui import open_gen_ui_agent
from agents.open_gen_ui_advanced import open_gen_ui_advanced_agent

app = create_antigravity_app(
    {
        "/declarative_gen_ui": declarative_gen_ui_agent(),
        "/a2ui_fixed_schema": a2ui_fixed_agent(),
        "/declarative_json_render": byoc_json_render_agent(),
        "/declarative_hashbrown": byoc_hashbrown_agent(),
        "/open_gen_ui": open_gen_ui_agent(),
        "/open_gen_ui_advanced": open_gen_ui_advanced_agent(),
    },
    path="/",
)
