import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
});
