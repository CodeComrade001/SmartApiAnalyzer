import * as signalR from "@microsoft/signalr";

const baseURL = import.meta.env.VITE_LOCAL_BACKEND_URL || "";

export const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${baseURL}/agents/endpoint/scan-result`)
  .withAutomaticReconnect()
  .build();
console.log("Turbo Log  ~ connection:", connection);

// This will hold the latest active scan id
let currentScanId: string | null = null;

connection.onreconnected(async () => {
  console.log("SignalR reconnected");

  if (currentScanId) {
    console.log("Rejoining group:", currentScanId);

    await connection.invoke("JoinScan", currentScanId);
  }
});

export function setCurrentScanId(scanId: string) {
  currentScanId = scanId;
}

export async function connectSignalR() {
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start();
  }
}