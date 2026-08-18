// Central axios instance. All endpoints go through /api/v1/*.
// Later this can be swapped for a real CodeIgniter 4 REST API.
import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BASE}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export const currency = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const compact = (n) => {
  if (!n && n !== 0) return "-";
  if (n >= 1e9) return `Rp${(n / 1e9).toFixed(1)}M`;
  if (n >= 1e6) return `Rp${(n / 1e6).toFixed(1)}Jt`;
  if (n >= 1e3) return `Rp${(n / 1e3).toFixed(0)}rb`;
  return `Rp${n}`;
};

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
