import { api } from "./api";
export const getDashboard = () => api.get("/dashboard").then((r) => r.data);
export const getNotifications = () => api.get("/notifications").then((r) => r.data);
