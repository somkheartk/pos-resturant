import "next-auth";
import "next-auth/jwt";

type AppRole = "admin" | "manager" | "staff";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: AppRole;
      permissions: string[];
    };
  }

  interface User {
    role: AppRole;
    accessToken?: string;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    accessToken?: string;
    permissions?: string[];
  }
}
