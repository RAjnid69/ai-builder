import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      const path = req.nextUrl.pathname;

      // Admin routes
      if (path.startsWith("/admin")) {
        return token?.role === "admin";
      }

      // User dashboard
      if (path.startsWith("/dashboard")) {
        return !!token;
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
