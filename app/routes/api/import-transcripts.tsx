import { data } from "react-router";
import { requireAdmin } from "../../lib/auth.server";
import { logActivity } from "../../lib/activity-log.server";
import { getTranscriptTextContent } from "../../lib/storage.server";
import { prisma } from "../../lib/prisma.server";
import type { Route } from "./+types/import-transcripts";

const TRANSCRIPTS_BASE_PATH = process.env.TRANSCRIPTS_BASE_PATH || "audio/transcripts";
const TRANSCRIPTS_JSONL_KEY = process.env.TRANSCRIPTS_JSONL_KEY || "audio/transcripts/transcriptions.jsonl";

interface TranscriptRecord {
  path?: string;
  filename?: string;
  transcription?: string;
  originalText?: string;
}

function extractFilename(record: TranscriptRecord): string | null {
  if (record.filename) {
    return record.filename;
  }
  if (record.path) {
    const parts = record.path.split("/");
    return parts[parts.length - 1];
  }
  return null;
}

function getTranscriptionText(record: TranscriptRecord): string {
  return record.transcription || record.originalText || "";
}

// POST: Import transcripts - clears existing and reimports all
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);

  try {
    // Fetch JSONL content from S3
    const jsonlContent = await getTranscriptTextContent(TRANSCRIPTS_JSONL_KEY);

    if (!jsonlContent) {
      return data({ error: `Transcripts file not found at: ${TRANSCRIPTS_JSONL_KEY}` }, { status: 404 });
    }

    // Parse JSONL
    const lines = jsonlContent.split("\n").filter((line) => line.trim());
    const records: TranscriptRecord[] = [];

    for (const line of lines) {
      try {
        records.push(JSON.parse(line));
      } catch {
        console.warn("Failed to parse JSONL line:", line);
      }
    }

    if (records.length === 0) {
      return data({ error: "No valid records found in JSONL" }, { status: 400 });
    }

    // Clear all existing transcripts (for testing)
    await prisma.transcript.deleteMany({});

    // Import all records
    let imported = 0;
    for (const record of records) {
      const filename = extractFilename(record);
      if (!filename) continue;

      const s3AudioKey = `${TRANSCRIPTS_BASE_PATH}/${filename}`;
      const originalText = getTranscriptionText(record);

      await prisma.transcript.create({
        data: {
          s3AudioKey,
          s3TextKey: TRANSCRIPTS_JSONL_KEY,
          originalText,
          status: "pending",
          markedCorrect: false,
        },
      });
      imported++;
    }

    await logActivity({
      userId: user.id,
      action: "import_transcripts",
      category: "admin",
      status: "success",
      metadata: { email: user.email, imported, total: records.length },
      request,
    });

    return data({
      success: true,
      message: `Cleared database and imported ${imported} transcripts`,
      imported,
      total: records.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return data(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

// GET: Return stats
export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const stats = await prisma.transcript.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const total = await prisma.transcript.count();

  return data({
    total,
    byStatus: stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      },
      {} as Record<string, number>
    ),
  });
}
