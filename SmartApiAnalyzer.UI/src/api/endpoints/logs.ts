import { api } from "../client";
import { ApiResponse, IngestLogResponse } from "../response/ApiResponse";



export const GLOBAL_UUID_FOR_TEST = "12345678-1234-1234-1234-123456789ABC";

export interface IngestLogPayload {
  DomainUrl: string;
}

export interface UpdateEndpointPayload {
  ScanId: string;
  DomainUrl: string;
  RoutesAndEndpoints: RoutesAndEndpointsPayload[];
}

export interface MethodPayload {
  Route: string,
  Payload: string,
}

export interface RoutesAndEndpointsPayload {
  Route: string;
  Endpoints: string[];
}

export interface ScanInitiationSwitchPayload {
  ScanId?: string;
  DomainUrl: string;
  ScanRequest: boolean;
  RoutesAndEndpoints: RoutesAndEndpointsPayload[];
  Agents: string[];
}

export const ingestDomainUrl = async (
  data: IngestLogPayload
): Promise<ApiResponse<IngestLogResponse>> => {
  const response = await api.post<ApiResponse<IngestLogResponse>>(
    "/api/v1/ingest",
    data
  );
  console.log("Turbo Log  ~ ingestDomainUrl ~ response:", response);


  return response.data;
};


export const getAllSans = async () => {
  const response = await api.get(
    "/api/v1"
  );
  console.log("Turbo Log  ~ getAllSans ~ response:", response);

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
  console.log("Turbo Log  ~ scanInitiationSwitch ~ response:", response);

  return response.data;
}


