export interface Flight {
airline?: string;
flight?: string;
depart?: string;
arrive?: string;
price_usd?: number;
}

export interface FlightListCardProps {
loading: boolean;
origin: string;
destination: string;
flights: Flight[];
}

export function FlightListCard({
loading,
origin,
destination,
flights,
}: FlightListCardProps) {
return (
  <article className="rounded-xl border p-4">
    <h3 className="font-semibold">
      {origin || "?"} → {destination || "?"}
    </h3>
    {loading ? (
      <p>Searching...</p>
    ) : (
      <ul>
        {flights.map((flight, index) => (
          <li key={`${flight.flight ?? "flight"}-${index}`}>
            {flight.airline ?? "--"} {flight.flight ?? ""}:{" "}
            {flight.depart ?? "?"} → {flight.arrive ?? "?"}
            {flight.price_usd !== undefined ? ` ($${flight.price_usd})` : ""}
          </li>
        ))}
      </ul>
    )}
  </article>
);
}
