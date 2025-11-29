import { data } from "react-router";
import { requireUser } from "../../lib/auth.server";
import { logActivity } from "../../lib/activity-log.server";
import type { Route } from "./+types/transcript";

// Resource route (no UI component) for transcript actions
export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);

  const formData = await request.formData();
  const actionType = formData.get("action")?.toString();
  const transcriptId = formData.get("transcriptId")?.toString() || "unknown";

  try {
    switch (actionType) {
      case "play": {
        await logActivity({
          userId: user.id,
          action: "audio_play",
          category: "transcript",
          status: "success",
          metadata: {
            email: user.email,
            transcriptId,
          },
          request,
        });
        return data({ success: true });
      }

      case "correct": {
        const markedCorrect = formData.get("markedCorrect") === "true";
        await logActivity({
          userId: user.id,
          action: "transcript_correct",
          category: "transcript",
          status: "success",
          metadata: {
            email: user.email,
            transcriptId,
            markedCorrect,
          },
          request,
        });
        return data({ success: true });
      }

      case "submit": {
        const transcript = formData.get("transcript")?.toString() || "";
        const originalTranscript = formData.get("originalTranscript")?.toString() || "";
        const wasEdited = transcript !== originalTranscript;

        await logActivity({
          userId: user.id,
          action: "transcript_submit",
          category: "transcript",
          status: "success",
          metadata: {
            email: user.email,
            transcriptId,
            transcriptLength: transcript.length,
            originalLength: originalTranscript.length,
            wasEdited,
          },
          request,
        });
        return data({ success: true });
      }

      case "skip": {
        await logActivity({
          userId: user.id,
          action: "transcript_skip",
          category: "transcript",
          status: "success",
          metadata: {
            email: user.email,
            transcriptId,
          },
          request,
        });
        return data({ success: true });
      }

      default:
        return data({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Transcript action error:", error);
    await logActivity({
      userId: user.id,
      action: `transcript_${actionType || "unknown"}`,
      category: "transcript",
      status: "error",
      metadata: {
        email: user.email,
        transcriptId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      request,
    });
    return data(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
