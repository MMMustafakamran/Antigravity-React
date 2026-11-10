"use client"; // HARNESS: App Router page with hooks needs it; the doc never shows the page file.
// HARNESS: the doc shows only the useComponent call. barChartPropsSchema, BarChart, the page component,
// the CopilotKit provider and the chat are never shown; everything outside the "Doc" blocks is harness.
// The system prompt also names render_pie_chart, which the page never registers.
// --- Doc (verbatim) ---
import { useComponent } from "@copilotkit/react-core/v2";
import { z } from "zod";
// --- end doc ---
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import { Bar, BarChart as RBarChart, XAxis, YAxis, Tooltip } from "recharts";

// HARNESS: never shown on the page.
const barChartPropsSchema = z.object({
  title: z.string(),
  description: z.string(),
  data: z.array(z.object({ label: z.string(), value: z.number() })),
});

// HARNESS: never shown on the page ("uses Recharts").
function BarChart(props: Partial<z.infer<typeof barChartPropsSchema>>) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h3>{props.title}</h3>
      <p>{props.description}</p>
      <RBarChart width={420} height={240} data={props.data ?? []}>
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#6366f1" />
      </RBarChart>
    </div>
  );
}

function Charts() {
  // --- Doc (verbatim) ---
  // src/app/demos/gen-ui-tool-based/page.tsx
  useComponent({
    name: "render_bar_chart",
    description: "Display a bar chart with labeled numeric values.",
    parameters: barChartPropsSchema,
    render: BarChart,
  });
  // --- end doc ---
  return null;
}

export default function Page() {
  return (
    // HARNESS: agent "gen-ui-tool-based" registered in route.ts -> backend/r6_main.py :8061/tool-based
    <CopilotKit runtimeUrl="/api/copilotkit" agent="gen-ui-tool-based">
      <Charts />
      <div style={{ height: "100vh" }}>
        <CopilotChat agentId="gen-ui-tool-based" />
      </div>
    </CopilotKit>
  );
}
