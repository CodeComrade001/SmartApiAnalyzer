import { api } from "../client";

export interface IngestLogPayload {
  endpoint: string;
  method: string;
  responseTimeMs: number;
  statusCode: number;
}

export interface UpdateEndpointPayload {
  scanId: string,
  routesAndEndpoints: { route: string; endpoint: string }[]
}

export interface ScanInitiationSwitchPayload {
  domainUrl: string;
  scanRequest: boolean;
  routesAndEndpoints: { route: string; endpoint: string }[]
  agents: string[];
}

export const ingestLog = async (
  data: IngestLogPayload
) => {
  const response = await api.post(
    "/api/v1/ingest",
    data
  );

  return response.data;
};


export const getAllSans = async (

) => {
  const response = await api.get(
    "/api/v1"
  );

  return response.data;
}

export const updateDomainEndpoint = async (
  data: UpdateEndpointPayload
) => {
  const response = await api.patch(
    "/api/v1/update-endpoint",
    data
  );

  return response.data;
}

export const scanInitiationSwitch = async (
  data: ScanInitiationSwitchPayload[]
) => {
  const response = await api.post(
    "/api/v1/start-scan",
    data
  );

  return response.data;
}


