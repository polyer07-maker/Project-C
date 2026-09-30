"use server";

import { signIn, signOut } from "@/lib/auth";

export async function signInWithGoogle(): Promise<void> {
  await signIn("google", { redirectTo: "/panou" });
}

export async function signInWithDemo(): Promise<void> {
  await signIn("demo", { redirectTo: "/panou" });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
