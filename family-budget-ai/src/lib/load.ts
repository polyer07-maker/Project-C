import { buildSnapshot } from "./finance/engine";
import type { HouseholdData, Snapshot } from "./finance/types";
import { loadHouseholdData, type HouseholdRecord } from "./repo";
import { requireSessionContext } from "./session";

export interface LoadedHousehold {
  household: HouseholdRecord;
  data: HouseholdData;
  snapshot: Snapshot;
}

export async function loadCurrentHousehold(): Promise<LoadedHousehold> {
  const { household } = await requireSessionContext();
  const data = loadHouseholdData(household);
  return { household, data, snapshot: buildSnapshot(data) };
}
