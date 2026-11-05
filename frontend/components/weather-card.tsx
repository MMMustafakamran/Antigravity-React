export interface WeatherCardProps {
loading: boolean;
location: string;
temperature?: number;
humidity?: number;
windSpeed?: number;
conditions?: string;
}

export function WeatherCard({
loading,
location,
temperature,
humidity,
windSpeed,
conditions,
}: WeatherCardProps) {
return (
  <article className="rounded-xl border p-4">
    <h3 className="font-semibold">{location || "Weather"}</h3>
    {loading ? (
      <p>Fetching weather...</p>
    ) : (
      <dl>
        <div>
          <dt>Conditions</dt>
          <dd>{conditions ?? "--"}</dd>
        </div>
        <div>
          <dt>Temperature</dt>
          <dd>{temperature ?? "--"}&deg;F</dd>
        </div>
        <div>
          <dt>Humidity</dt>
          <dd>{humidity ?? "--"}%</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{windSpeed ?? "--"} mph</dd>
        </div>
      </dl>
    )}
  </article>
);
}
