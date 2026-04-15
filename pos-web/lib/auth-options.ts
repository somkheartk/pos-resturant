import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type AppRole = "admin" | "manager" | "staff";

type BackendLoginResponse = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
  };
};

const backendApiBase =
  process.env.POS_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000/api/v1";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const response = await fetch(`${backendApiBase}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as BackendLoginResponse;
        const normalizedRole =
          payload.user.role === "admin" || payload.user.role === "manager"
            ? payload.user.role
            : "staff";

        return {
          id: payload.user.id,
          name: payload.user.name,
          email: payload.user.email,
          role: normalizedRole as AppRole,
          accessToken: payload.accessToken,
          permissions: payload.user.permissions ?? [],
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.permissions = user.permissions ?? [];
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.name = token.name ?? session.user.name;
        session.user.role = (token.role as AppRole | undefined) ?? "staff";
        session.user.permissions = (token.permissions as string[] | undefined) ?? [];
        session.accessToken = (token.accessToken as string | undefined) ?? "";
      }
      return session;
    },
  },
};
