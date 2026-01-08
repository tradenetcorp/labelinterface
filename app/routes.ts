import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in/*", "routes/sign-in.tsx"),
  route("login", "routes/login.tsx"),
  route("login-password", "routes/login-password.tsx"),
  route("verify", "routes/verify.tsx"),
  route("logout", "routes/logout.tsx"),
  route("admin/users", "routes/admin/users.tsx"),
  route("admin/logs", "routes/admin/logs.tsx"),
  route("admin/labels", "routes/admin/labels.tsx"),
  route("admin/import", "routes/admin/import.tsx"),
  route("api/transcript", "routes/api/transcript.tsx"),
  route("api/import-transcripts", "routes/api/import-transcripts.tsx"),
] satisfies RouteConfig;
