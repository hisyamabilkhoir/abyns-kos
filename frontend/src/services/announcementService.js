import { api } from "./api";

export const listAnnouncements = () =>
  api.get("/announcements").then((r) => r.data);

export const createAnnouncement = (body) =>
  api.post("/announcements", body).then((r) => r.data);

export const deleteAnnouncement = (id) =>
  api.delete(`/announcements/${id}`).then((r) => r.data);

// Tenant side
export const listTenantAnnouncements = (tenantId) =>
  api.get(`/tenant/${tenantId}/announcements`).then((r) => r.data);

export const markAnnouncementRead = (tenantId, annId) =>
  api.post(`/tenant/${tenantId}/announcements/${annId}/read`).then((r) => r.data);
