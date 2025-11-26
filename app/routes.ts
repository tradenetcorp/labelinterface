import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in/*", "routes/sign-in.tsx"),
  route("login", "routes/login.tsx"),
  route("login-password", "routes/login-password.tsx"),
  route("verify", "routes/verify.tsx"),
  route("logout", "routes/logout.tsx"),
  route("admin/users", "routes/admin/users.tsx"),
] satisfies RouteConfig;
