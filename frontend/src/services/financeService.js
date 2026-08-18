import { api } from "./api";
export const getFinanceSummary = () => api.get("/finance/summary").then((r) => r.data);
export const listExpenses = () => api.get("/expenses").then((r) => r.data);
