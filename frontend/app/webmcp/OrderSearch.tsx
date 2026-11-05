"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

export function OrderSearch() {
  useFrontendTool({
    name: "searchOrders",
    description: "Search the signed-in user's orders by status",
    parameters: z.object({
      status: z.enum(["open", "shipped", "delivered"]),
    }),
    handler: async ({ status }) => {
      const orders = await searchOrders(status);
      return JSON.stringify(orders);
    },
    webmcp: {
      annotations: {
        readOnlyHint: true,
      },
    },
  });

  return null;
}

// HARNESS: searchOrders is called above but never defined on the page. Fixed fake data.
async function searchOrders(status: "open" | "shipped" | "delivered") {
  const all = [
    { id: "A-1001", status: "open", total: 42 },
    { id: "A-1002", status: "shipped", total: 18 },
    { id: "A-1003", status: "delivered", total: 99 },
  ];
  return all.filter((o) => o.status === status);
}
