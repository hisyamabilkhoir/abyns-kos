import { api } from "./api";
export const listProperties = () => api.get("/properties").then((r) => r.data);
export const getProperty = (id) => api.get(`/properties/${id}`).then((r) => r.data);
export const listRooms = (propertyId) =>
  api.get("/rooms", { params: propertyId ? { property_id: propertyId } : {} }).then((r) => r.data);
