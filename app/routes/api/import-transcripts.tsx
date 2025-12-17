import { data } from "react-router";
import { requireUser } from "../../lib/auth.server";
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
  // Try filename field first
  if (record.filename) {
    return record.filename;
  }
  // Extract from path if present
  if (record.path) {
    const parts = record.path.split("/");
    return parts[parts.length - 1];
  }
  return null;
}

function getTranscriptionText(record: TranscriptRecord): string {
  return record.transcription || record.originalText || "";
}

// Resource route for importing transcripts from S3
export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);

  // Only admins can import transcripts
  if (user.role !== "admin") {
    return data({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Fetch JSONL from S3
    const jsonlContent = await getTranscriptTextContent(TRANSCRIPTS_JSONL_KEY);

    if (!jsonlContent) {
      await logActivity({
        userId: user.id,
        action: "import_transcripts",
        category: "admin",
        status: "failure",
        metadata: {
          email: user.email,
          reason: "JSONL file not found or empty",
          s3Key: TRANSCRIPTS_JSONL_KEY,
        },
        request,
      });
      return data({ error: "Transcripts file not found in S3" }, { status: 404 });
    }

    // Parse JSONL (one JSON object per line)
    const lines = jsonlContent.split("\n").filter((line) => line.trim());
    const records: TranscriptRecord[] = [];

    for (const line of lines) {
      try {
        const record = JSON.parse(line) as TranscriptRecord;
        records.push(record);
      } catch {
        console.warn("Failed to parse JSONL line:", line);
      }
    }

    if (records.length === 0) {
      return data({ error: "No valid records found in JSONL" }, { status: 400 });
    }

    // Import records to database
    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      const filename = extractFilename(record);
      if (!filename) {
        skipped++;
        continue;
      }

      const s3AudioKey = `${TRANSCRIPTS_BASE_PATH}/${filename}`;
      const originalText = getTranscriptionText(record);

      // Check if already exists
      const existing = await prisma.transcript.findFirst({
        where: { s3AudioKey },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create new transcript record
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
      metadata: {
        email: user.email,
        totalRecords: records.length,
        imported,
        skipped,
        s3Key: TRANSCRIPTS_JSONL_KEY,
      },
      request,
    });

    return data({
      success: true,
      message: `Imported ${imported} transcripts, skipped ${skipped} (already exist or invalid)`,
      imported,
      skipped,
      total: records.length,
    });
  } catch (error) {
    console.error("Import transcripts error:", error);
    await logActivity({
      userId: user.id,
      action: "import_transcripts",
      category: "admin",
      status: "error",
      metadata: {
        email: user.email,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      request,
    });
    return data(
      { error: "Failed to import transcripts. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to check import status
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);

  if (user.role !== "admin") {
    return data({ error: "Unauthorized" }, { status: 403 });
  }

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

