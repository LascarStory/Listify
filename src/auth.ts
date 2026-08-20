import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  trustHost: true,
  callbacks: {
    async signIn({ profile }) {
      return profile?.email === process.env.ADMIN_EMAIL;
    },
  },
  pages: {
    error: "/",
  },
});
