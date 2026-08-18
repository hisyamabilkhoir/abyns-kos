import { api } from "./api";

export const runExitInterview = () =>
  api.post("/advisor/actions/exit-interview").then((r) => r.data);

export const runLoyaltyProgram = () =>
  api.post("/advisor/actions/loyalty-program").then((r) => r.data);

export const runPreventiveMaintenance = () =>
  api.post("/advisor/actions/preventive-maintenance").then((r) => r.data);
