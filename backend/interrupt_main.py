# HARNESS: the useInterrupt page gives only the tool below. The agent and app wiring
# copy the quickstart main.py, plus tools=[...] (FINDINGS.md #18).
import os

from ag_ui_antigravity import AntigravityAgent, create_antigravity_app

# --- Doc: https://docs.copilotkit.ai/google-antigravity/human-in-the-loop/useInterrupt (verbatim) ---
from ag_ui_antigravity import experimental_interrupt

async def schedule_meeting(topic: str, attendee: str) -> str:
    """Books a meeting once the user picks a time."""
    answer = await experimental_interrupt(
        "schedule_meeting",
        message=f"Pick a time for {topic}",
        metadata={"topic": topic, "attendee": attendee},
    )
    if not answer.resolved:
        return f"Not scheduled ({answer.status})."
    return f"Scheduled for {answer.payload['chosen_label']}."
# --- end doc ---

agent = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    # HARNESS: the doc's interrupt_agent.py SYSTEM_PROMPT (LangGraph file), reused as instructions.
    system_instructions=(
        "You are a scheduling assistant. Whenever the user asks you to book a "
        "call / schedule a meeting, you MUST call the `schedule_meeting` tool. "
        "Pass a short `topic` describing the purpose and `attendee` describing "
        "who the meeting is with. After the tool returns, confirm briefly "
        "whether the meeting was scheduled and at what time, or that the user "
        "cancelled."
    ),
    tools=[schedule_meeting],
    workspaces=["/srv/agents/w1"],
)

app = create_antigravity_app(agent, path="/")
