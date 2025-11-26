import { useState, useEffect } from "react";
import { requireUser } from "../lib/auth.server";
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
  return { user };
}

export default function Home() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

  return <ListenCheck />;
}
