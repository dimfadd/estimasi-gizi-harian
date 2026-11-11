import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { devLoginEnabled } from "@/lib/devlogin";
import { upsertUser } from "@/lib/server/users";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

/**
 * Login uji lokal. Sengaja dibatasi tiga lapis supaya tidak bisa aktif di produksi:
 * harus DEV_LOGIN=1, tidak boleh berjalan di Vercel, dan hanya email @dev.local
 * (tidak bisa dipakai menyamar sebagai akun Google sungguhan).
 */
const devLogin = devLoginEnabled;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 60 },
  pages: { signIn: "/" },
  providers: [
    Google,
    ...(devLogin
      ? [
          Credentials({
            id: "dev",
            name: "Dev",
            credentials: { email: {} },
            authorize: async (c) => {
              const email = String(c?.email ?? "").toLowerCase();
              if (!/^[a-z0-9._-]+@dev\.local$/.test(email)) return null;
              return { id: email, email, name: email.split("@")[0] };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // hanya email Google yang sudah terverifikasi
      if (account?.provider === "google") return profile?.email_verified === true;
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account) {
        const id = await upsertUser({
          email: String(user?.email ?? profile?.email ?? token.email),
          googleSub: account.provider === "google" ? account.providerAccountId : null,
          name: (profile?.name as string | undefined) ?? user?.name ?? null,
          image: (profile?.picture as string | undefined) ?? user?.image ?? null,
        });
        token.uid = String(id);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = String(token.uid);
      return session;
    },
  },
});
