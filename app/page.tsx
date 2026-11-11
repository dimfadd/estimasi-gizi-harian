import { auth } from "@/auth";
import App from "@/components/App";
import Landing from "@/components/Landing";
import SetupNeeded from "@/components/SetupNeeded";
import { dbEnabled } from "@/lib/db";
import { devLoginEnabled } from "@/lib/devlogin";

export const dynamic = "force-dynamic";

export default async function Page() {
  const missing = [
    !dbEnabled && "DATABASE_URL",
    !process.env.AUTH_SECRET && "AUTH_SECRET",
    !devLoginEnabled && !process.env.AUTH_GOOGLE_ID && "AUTH_GOOGLE_ID",
    !devLoginEnabled && !process.env.AUTH_GOOGLE_SECRET && "AUTH_GOOGLE_SECRET",
  ].filter(Boolean) as string[];
  if (missing.length) return <SetupNeeded missing={missing} />;

  const session = await auth();
  if (!session?.user?.id) return <Landing devLogin={devLoginEnabled} />;
  return <App />;
}
