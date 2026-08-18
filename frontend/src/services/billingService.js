import { api } from "./api";
export const listInvoices = (params = {}) =>
  api.get("/invoices", { params }).then((r) => r.data);
