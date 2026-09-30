import { redirect } from "next/navigation";
import { auth, DEMO_EMAIL } from "./auth";
import { getOrCreateHousehold, householdIsEmpty, upsertUser, type HouseholdRecord, type UserRecord } from "./repo";
import { seedDemoHousehold } from "./seed";

export interface SessionContext {
  user: UserRecord;
  household: HouseholdRecord;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;

  const user = upsertUser({
    email,
    name: session.user?.name ?? null,
    image: session.user?.image ?? null,
  });
  const household = getOrCreateHousehold(user.id, user.name ? `Familia ${user.name.split(" ")[0]}` : "Familia mea");

  // The demo account is meant to be explored, so it starts with data.
  if (email === DEMO_EMAIL && householdIsEmpty(household.id)) {
    seedDemoHousehold(household.id);
    return { user, household: getOrCreateHousehold(user.id) };
  }

  return { user, household };
}

export async function requireSessionContext(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) redirect("/");
  return context;
}
