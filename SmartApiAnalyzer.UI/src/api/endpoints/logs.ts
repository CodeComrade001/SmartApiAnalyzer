import { api } from "../client";

export interface IngestLogPayload {
  endpoint: string;
  method: string;
  responseTimeMs: number;
  statusCode: number;
}

export const ingestLog = async (
  data: IngestLogPayload
) => {
  const response = await api.post(
    "/api/v1/logs/ingest",
    data
  );

  return response.data;
};