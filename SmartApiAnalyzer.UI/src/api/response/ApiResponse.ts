export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface EndpointDiscovery {
  path: string;
  suggestedMethods: string[];
}

export interface IngestLogResponse {
  scanId: string;
  domainUrl: string;
  endpoints: EndpointDiscovery[];
}