"use server";

import { signIn, signOut } from "@/auth";
import { devLoginEnabled } from "@/lib/devlogin";

export async function signInGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInDev(form: FormData) {
  if (!devLoginEnabled) return;
  await signIn("dev", { email: String(form.get("email") ?? ""), redirectTo: "/" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
