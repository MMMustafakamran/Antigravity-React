// HARNESS: verbatim from the doc, except the import paths (doc: ../components, ../lib), changed because this lives at app/generative-ui/tool-rendering/.
"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { WeatherCard } from "../../../components/weather-card";
import { FlightListCard, type Flight } from "../../../components/flight-list-card";
import { parseJsonResult } from "../../../lib/parse-json-result";

interface WeatherResult {
city?: string;
temperature?: number;
humidity?: number;
wind_speed?: number;
conditions?: string;
}

interface FlightSearchResult {
origin?: string;
destination?: string;
flights?: Flight[];
}

export function ToolRenderers() {
useRenderTool(
  {
    name: "get_weather",
    parameters: z.object({ location: z.string() }),
    render: ({ parameters, result, status }) => {
      const parsed = parseJsonResult<WeatherResult>(result);
      return (
        <WeatherCard
          loading={status !== "complete"}
          location={parameters?.location ?? parsed.city ?? ""}
          temperature={parsed.temperature}
          humidity={parsed.humidity}
          windSpeed={parsed.wind_speed}
          conditions={parsed.conditions}
        />
      );
    },
  },
  [],
);

useRenderTool(
  {
    name: "search_flights",
    parameters: z.object({
      origin: z.string(),
      destination: z.string(),
    }),
    render: ({ parameters, result, status }) => {
      const parsed = parseJsonResult<FlightSearchResult>(result);
      return (
        <FlightListCard
          loading={status !== "complete"}
          origin={parameters?.origin ?? parsed.origin ?? ""}
          destination={parameters?.destination ?? parsed.destination ?? ""}
          flights={parsed.flights ?? []}
        />
      );
    },
  },
  [],
);

return null;
}
