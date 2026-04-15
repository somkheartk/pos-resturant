import { withAuth } from "next-auth/middleware";

function requiredPermissionForPath(pathname: string): string {
  if (pathname.startsWith("/admin")) return "admin:settings";
  if (pathname.startsWith("/users")) return "users:view";
  if (pathname.startsWith("/branches")) return "branches:view";
  if (pathname.startsWith("/orders") || pathname.startsWith("/reports") || pathname.startsWith("/tables")) {
    return "orders:view";
  }
  if (pathname.startsWith("/inventory")) return "inventory:view";
  if (pathname.startsWith("/po")) return "po:view";
  if (pathname.startsWith("/products")) return "products:view";
  if (pathname.startsWith("/categories")) return "category:view";
  return "dashboard:view";
}

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) {
        return false;
      }

      const required = requiredPermissionForPath(req.nextUrl.pathname);
      const permissions = Array.isArray(token.permissions)
        ? token.permissions.filter((permission): permission is string => typeof permission === "string")
        : [];

      return permissions.includes(required);
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/users/:path*",
    "/branches/:path*",
    "/orders/:path*",
    "/tables/:path*",
    "/inventory/:path*",
    "/po/:path*",
    "/products/:path*",
    "/categories/:path*",
  ],
};
