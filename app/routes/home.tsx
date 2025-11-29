import { useState, useEffect } from "react";
import { requireUser } from "../lib/auth.server";
import { logActivity } from "../lib/activity-log.server";
import type { Route } from "./+types/home";
import { ListenCheck } from "../components/listen-check";
import { LoadingScreen } from "../components/loading-screen";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Label App" },
    { name: "description", content: "Listen and Check Interface" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);

  // Log page view
  await logActivity({
    userId: user.id,
    action: "view_home",
    category: "page",
    status: "success",
    metadata: { email: user.email, role: user.role },
    request,
  });

  return { user };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const user = loaderData?.user;

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return <ListenCheck userId={user?.id} userEmail={user?.email} />;
}
