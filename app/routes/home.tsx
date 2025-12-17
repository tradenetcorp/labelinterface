import { useState, useEffect } from "react";
import { requireUser } from "../lib/auth.server";
import { logActivity } from "../lib/activity-log.server";
import { prisma } from "../lib/prisma.server";
import { getTranscriptAudioUrl } from "../lib/storage.server";
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

  // Fetch next pending transcript
  const transcript = await prisma.transcript.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  // Get presigned audio URL if transcript exists
  let audioUrl: string | null = null;
  if (transcript) {
    try {
      audioUrl = await getTranscriptAudioUrl(transcript.s3AudioKey);
    } catch (error) {
      console.error("Failed to get audio URL:", error);
    }
  }

  // Get total pending count
  const pendingCount = await prisma.transcript.count({
    where: { status: "pending" },
  });

  return {
    user,
    transcript: transcript
      ? {
          id: transcript.id,
          originalText: transcript.originalText,
          audioUrl,
          s3AudioKey: transcript.s3AudioKey,
        }
      : null,
    pendingCount,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { user, transcript, pendingCount } = loaderData ?? {};

  useEffect(() => {
    // Brief loading state for transition
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <ListenCheck
      userId={user?.id}
      userEmail={user?.email}
      transcript={transcript}
      pendingCount={pendingCount ?? 0}
    />
  );
}
