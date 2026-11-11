// HARNESS: "./demo-layout" (ACTIVITIES, DemoLayout) is imported by the doc but never shown. Minimal stand-in.
export const ACTIVITIES = [
  "Opened the Q3 budget spreadsheet",
  "Commented on the launch plan",
  "Booked a flight to Berlin",
];
export function DemoLayout(props: {
  userName: string;
  userTimezone: string;
  recentActivity: string[];
  onUserNameChange?: (v: string) => void;
  onUserTimezoneChange?: (v: string) => void;
  onToggleActivity?: (a: string) => void;
}) {
  return (
    <div style={{ padding: 24 }}>
      <p>User: {props.userName}</p>
      <p>Timezone: {props.userTimezone}</p>
      <ul>{props.recentActivity.map((a) => <li key={a}>{a}</li>)}</ul>
    </div>
  );
}
