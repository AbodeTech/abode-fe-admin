import { agencyHandlers } from "./agency";
import { allocationHandlers } from "./allocation";
import { assetsHandlers } from "./assets";
import { associatesHandlers } from "./associates";
import { authHandlers } from "./auth";
import { campaignsHandlers } from "./campaigns";
import { dashboardHandlers } from "./dashboard";
import { miscHandlers } from "./misc";
import { transactionsHandlers } from "./transactions";
import { usersHandlers } from "./users";

export type MockHandler = (variables?: Record<string, unknown>) => unknown;

export const mockHandlers: Record<string, MockHandler> = {
  ...authHandlers,
  ...agencyHandlers,
  ...allocationHandlers,
  ...dashboardHandlers,
  ...usersHandlers,
  ...transactionsHandlers,
  ...assetsHandlers,
  ...campaignsHandlers,
  ...associatesHandlers,
  ...miscHandlers,
};
