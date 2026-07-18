import { RoutesAndEndpointsPayload } from "@/api/endpoints/logs";
import { ApiEndpoint } from "@/types";

export const getallMethodEndpointGrouped = (endpoints: ApiEndpoint[]): RoutesAndEndpointsPayload[] => {
  const grouped: Record<string, string[]> = {};

  endpoints.forEach((endpoint) => {
    const method = endpoint.method;
    if (!method) return []; // skip if no valid method

    if (!grouped[method]) {
      grouped[method] = [];
    }
    grouped[method].push(endpoint.correctedPath || endpoint.inferredPath);
  });

  const result = Object.entries(grouped).map(([route, methods]) => ({
    Route: route,
    Endpoints: methods,
  }));
  console.log("Turbo Log  ~ getallMethodEndpointGrouped ~ result:", result);
  return result;
};