import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

/**
 * The demo account exists so the app can be opened and evaluated without
 * Google OAuth credentials. It is off by default once Google is configured,
 * and can always be forced with DEMO_LOGIN=on/off.
 */
export const demoLoginEnabled =
  process.env.DEMO_LOGIN === "on" || (process.env.DEMO_LOGIN !== "off" && !googleConfigured);

export const DEMO_EMAIL = "demo@bugetfamilie.ro";

const providers: NextAuthConfig["providers"] = [];

if (googleConfigured) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: { prompt: "consent", access_type: "offline", scope: "openid email profile" },
      },
    }),
  );
}

if (demoLoginEnabled) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Cont demo",
      credentials: {},
      authorize: async () => ({
        id: DEMO_EMAIL,
        email: DEMO_EMAIL,
        name: "Familia Demo",
        image: null,
      }),
    }),
  );
}

const config: NextAuthConfig = {
  providers,
  secret: process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : "dev-secret-not-for-production"),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  pages: { signIn: "/", error: "/" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.image = (token.picture as string | null) ?? session.user.image;
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
