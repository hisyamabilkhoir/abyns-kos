import { api } from "./api";

export const tenantLogin = (email) =>
  api.post("/tenant/login", { email }).then((r) => r.data);

export const getTenantDashboard = (id) =>
  api.get(`/tenant/${id}/dashboard`).then((r) => r.data);

export const listMyInvoices = (id) =>
  api.get(`/tenant/${id}/invoices`).then((r) => r.data);

// Legacy mock pay (kept for fallback demo scenarios)
export const payInvoice = (invoiceId) =>
  api.post(`/invoices/${invoiceId}/pay`).then((r) => r.data);

// QRIS (Midtrans)
export const chargeQris = (invoiceId) =>
  api.post(`/invoices/${invoiceId}/qris/charge`).then((r) => r.data);
export const getQrisStatus = (invoiceId) =>
  api.get(`/invoices/${invoiceId}/qris/status`).then((r) => r.data);

export const listMyMaintenance = (id) =>
  api.get(`/tenant/${id}/maintenance`).then((r) => r.data);

export const createMaintenance = (id, body) =>
  api.post(`/tenant/${id}/maintenance`, body).then((r) => r.data);

const KEY = "abyns_tenant";
export const saveSession = (data) => localStorage.setItem(KEY, JSON.stringify(data));
export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};
export const clearSession = () => localStorage.removeItem(KEY);
