import { api } from "./api";

export const remindersHistory = () => api.get("/reminders").then((r) => r.data);
export const remindersPreview = () => api.get("/reminders/preview").then((r) => r.data);
export const sendReminder = (invoiceId) =>
  api.post("/reminders/send", { invoice_id: invoiceId }).then((r) => r.data);
