import { data, redirect } from "react-router";
import { requireUser } from "../../lib/auth.server";
import { logActivity } from "../../lib/activity-log.server";
import { prisma } from "../../lib/prisma.server";
import type { Route } from "./+types/transcript";

// Resource route (no UI component) for transcript actions
export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);

  const formData = await request.formData();
  const actionType = formData.get("action")?.toString();
  const transcriptIdStr = formData.get("transcriptId")?.toString() || "unknown";
  const transcriptId = parseInt(transcriptIdStr, 10);

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
            transcriptId: transcriptIdStr,
          },
          request,
        });
        return data({ success: true });
      }

      case "correct": {
        const markedCorrect = formData.get("markedCorrect") === "true";

        // Update markedCorrect in database
        if (!isNaN(transcriptId)) {
          await prisma.transcript.update({
            where: { id: transcriptId },
            data: { markedCorrect },
          });
        }

        await logActivity({
          userId: user.id,
          action: "transcript_correct",
          category: "transcript",
          status: "success",
          metadata: {
            email: user.email,
            transcriptId: transcriptIdStr,
            markedCorrect,
          },
          request,
        });
        return data({ success: true });
      }

      case "submit": {
        const transcript = formData.get("transcript")?.toString() || "";
        const originalTranscript =
          formData.get("originalTranscript")?.toString() || "";
        const markedCorrect = formData.get("markedCorrect") === "true";
        const labels = formData.get("labels")?.toString() || "[]";
        const wasEdited = transcript !== originalTranscript;

        // Update transcript in database
        if (!isNaN(transcriptId)) {
          await prisma.transcript.update({
            where: { id: transcriptId },
            data: {
              editedText: wasEdited ? transcript : null,
              status: "completed",
              markedCorrect,
              labels,
              reviewedById: user.id,
            },
          });
        }

        await logActivity({
          userId: user.id,
          action: "transcript_submit",
          category: "transcript",
          status: "success",
          metadata: {
            email: user.email,
            transcriptId: transcriptIdStr,
            transcriptLength: transcript.length,
            originalLength: originalTranscript.length,
            wasEdited,
            markedCorrect,
            labels,
          },
          request,
        });

        // Redirect to reload page with next transcript
        return redirect("/");
      }

      case "skip": {
        // Update transcript status to skipped
        if (!isNaN(transcriptId)) {
          await prisma.transcript.update({
            where: { id: transcriptId },
            data: {
              status: "skipped",
              reviewedById: user.id,
            },
          });
        }

        await logActivity({
          userId: user.id,
          action: "transcript_skip",
          category: "transcript",
          status: "success",
          metadata: {
            email: user.email,
            transcriptId: transcriptIdStr,
          },
          request,
        });

        // Redirect to reload page with next transcript
        return redirect("/");
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
        transcriptId: transcriptIdStr,
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
