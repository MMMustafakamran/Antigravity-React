// HARNESS: pie-chart.tsx imported but not shown on the page. Minimal stand-in (schema + a plain list).
import { z } from "zod";

export const pieChartPropsSchema = z.object({
  title: z.string(),
  description: z.string(),
  data: z.array(z.object({ label: z.string(), value: z.number() })),
});

export function PieChart(props: Partial<z.infer<typeof pieChartPropsSchema>>) {
  return (
    <div>
      <strong>{props.title}</strong>
      <ul>{(props.data ?? []).map((d) => <li key={d.label}>{d.label}: {d.value}</li>)}</ul>
    </div>
  );
}
