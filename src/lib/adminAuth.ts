import { auth } from "@/auth";

export async function requireAdminSession() {
  const session = await auth();
  if (session?.user?.email && session.user.email === process.env.ADMIN_EMAIL) {
    return session;
  }
  return null;
}
