import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://mt5-saa-s-automated-dashboard-ett2.vercel.app/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}