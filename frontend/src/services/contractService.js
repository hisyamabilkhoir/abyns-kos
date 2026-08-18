import { api } from "./api";

export const listExpiringContracts = (withinDays = 60) =>
  api.get("/contracts/expiring", { params: { within_days: withinDays } }).then((r) => r.data);

export const renewContract = (contractId, months = 12) =>
  api.post(`/contracts/${contractId}/renew`, { months }).then((r) => r.data);
