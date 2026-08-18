import { api } from "./api";
export const listMaintenance = () => api.get("/maintenance").then((r) => r.data);
