import { redirect } from "react-router";
import { getSession, destroySession as destroyCookieSession } from "../lib/session.server";
import { destroySession } from "../lib/auth.server";
import { requireUser } from "../lib/auth.server";
import { logActivity } from "../lib/activity-log.server";
import type { Route } from "./+types/logout";

export async function loader({ request }: Route.LoaderArgs) {
  // Require user to be logged in
  const user = await requireUser(request);

  // Log logout
  await logActivity({
    userId: user.id,
    action: "logout",
    category: "auth",
    status: "success",
    metadata: { email: user.email },
    request,
  });

  // Get session ID from cookie
  const session = await getSession(request.headers.get("Cookie"));
  const sessionId = session.get("sessionId");

  if (sessionId) {
    // Destroy session in database
    await destroySession(sessionId);
  }

  // Destroy cookie session
  const cookie = await destroyCookieSession(session);

  // Redirect to login
  throw redirect("/login", {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  // Require user to be logged in
  const user = await requireUser(request);

  // Log logout
  await logActivity({
    userId: user.id,
    action: "logout",
    category: "auth",
    status: "success",
    metadata: { email: user.email },
    request,
  });

  // Get session ID from cookie
  const session = await getSession(request.headers.get("Cookie"));
  const sessionId = session.get("sessionId");

  if (sessionId) {
    // Destroy session in database
    await destroySession(sessionId);
  }

  // Destroy cookie session
  const cookie = await destroyCookieSession(session);

  // Redirect to login
  throw redirect("/login", {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}
