import { auth } from "@/auth";
import Dashboard from "./Dashboard";
import LoginGate from "./LoginGate";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const isAdmin = !!email && email === process.env.ADMIN_EMAIL;

  if (!isAdmin) {
    return <LoginGate deniedEmail={email && !isAdmin ? email : null} />;
  }

  return <Dashboard userEmail={email} />;
}
