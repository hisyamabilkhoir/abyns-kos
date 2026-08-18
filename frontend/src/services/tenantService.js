import { api } from "./api";
export const listTenants = () => api.get("/tenants").then((r) => r.data);
export const getTenant = (id) => api.get(`/tenants/${id}`).then((r) => r.data);
