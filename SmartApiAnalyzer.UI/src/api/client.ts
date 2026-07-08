import axios from "axios";

const baseURL = import.meta.env.VITE_LOCAL_BACKEND_URL || "";
console.log("Turbo Log  ~ baseURL:", baseURL);

export const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});