import {
  GLOBAL_UUID_FOR_TEST,
  ScanInitiationSwitchPayload,
  UpdateEndpointPayload,
} from "@/api/endpoints/logs";
import { WebsiteApiGroup } from "@/types";

// You said you'll handle this import
import { RoutesAndEndpointsPayload } from '../../api/endpoints/logs';
// import { GLOBAL_UUID_FOR_TEST } from "@/constants";

export const updateDomainEndpointPayloadNormalize = (
  website: WebsiteApiGroup
): UpdateEndpointPayload => {

  const endpoint_groupedRoutes: Record<string, Set<string>> = {};

  website.endpoints.forEach((endpoint) => {
    const route =
      endpoint.inferredPath || endpoint.correctedPath;

    if (!route) return {
      ScanId: "",
      domainUrl: "",
      RoutesAndEndpointsPayload: []
    };

    if (!endpoint_groupedRoutes[route]) {
      endpoint_groupedRoutes[route] = new Set();
    }

    endpoint_groupedRoutes[route].add(endpoint.method);
  });

  return {
    ScanId: GLOBAL_UUID_FOR_TEST,
    DomainUrl: website.websiteUrl,
    RoutesAndEndpoints: Object.entries(endpoint_groupedRoutes).map(
      ([route, methods]) => ({
        Route: route,
        Endpoints: [...methods],
      })
    ),
  };
};



export const scanInitiationSwitchPayloadNormalize = (
  websites: WebsiteApiGroup[], agentSelected: string[]
): ScanInitiationSwitchPayload[] => {
  return websites.map((website) => {
    const scanInitiation_groupedRoutes: Record<string, Set<string>> = {};

    website.endpoints.forEach((endpoint) => {
      const route = endpoint.inferredPath || endpoint.correctedPath;

      if (!route) return;

      if (!scanInitiation_groupedRoutes[route]) {
        scanInitiation_groupedRoutes[route] = new Set();
      }

      scanInitiation_groupedRoutes[route].add(endpoint.method);
    });

    return {
      ScanId: GLOBAL_UUID_FOR_TEST,
      DomainUrl: website.websiteUrl,
      ScanRequest: true,
      RoutesAndEndpoints: Object.entries(scanInitiation_groupedRoutes).map(
        ([route, methods]) => ({
          Route: route,
          Endpoints: [...methods],
        })
      ),
      Agents: agentSelected,
    } as ScanInitiationSwitchPayload;
  });
};