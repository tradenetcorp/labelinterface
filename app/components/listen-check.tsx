import { useState } from "react";
import { useFetcher } from "react-router";
import { ListenSection } from "./listen-section";
import { CheckSection } from "./check-section";
import { LoadingScreen } from "./loading-screen";

interface TranscriptData {
  id: number;
  originalText: string;
  audioUrl: string | null;
  s3AudioKey: string;
}

interface ListenCheckProps {
  userId?: number;
  userEmail?: string;
  transcript?: TranscriptData | null;
  pendingCount: number;
}

export function ListenCheck({
  userId,
  userEmail,
  transcript: transcriptData,
  pendingCount,
}: ListenCheckProps) {
  const [editedText, setEditedText] = useState(transcriptData?.originalText ?? "");
  const [markedCorrect, setMarkedCorrect] = useState(false);

  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  // Reset state when transcript changes
  const transcriptId = transcriptData?.id;
  const [lastTranscriptId, setLastTranscriptId] = useState(transcriptId);
  if (transcriptId !== lastTranscriptId) {
    setLastTranscriptId(transcriptId);
    setEditedText(transcriptData?.originalText ?? "");
    setMarkedCorrect(false);
  }

  // Empty state - no transcripts to review
  if (!transcriptData) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-semibold text-gray-200">All caught up!</h2>
          <p className="text-gray-400">
            No more transcripts to review. Check back later or import new ones.
          </p>
          <a
            href="/admin/import"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Transcripts
          </a>
          {userEmail && (
            <p className="text-sm text-gray-500 mt-4">Logged in as {userEmail}</p>
          )}
        </div>
      </div>
    );
  }

  const handlePlay = () => {
    fetcher.submit(
      {
        action: "play",
        transcriptId: String(transcriptData.id),
      },
      { method: "post", action: "/api/transcript" }
    );
  };

  const handleCorrect = () => {
    const newCorrectState = !markedCorrect;
    setMarkedCorrect(newCorrectState);
    fetcher.submit(
      {
        action: "correct",
        transcriptId: String(transcriptData.id),
        markedCorrect: String(newCorrectState),
      },
      { method: "post", action: "/api/transcript" }
    );
  };

  const handleEdit = () => {
    // Edit is handled locally in CheckSection
    console.log("Edit mode toggled");
  };

  const handleSubmit = () => {
    fetcher.submit(
      {
        action: "submit",
        transcriptId: String(transcriptData.id),
        transcript: editedText,
        originalTranscript: transcriptData.originalText,
        markedCorrect: String(markedCorrect),
      },
      { method: "post", action: "/api/transcript" }
    );
  };

  const handleSkip = () => {
    fetcher.submit(
      {
        action: "skip",
        transcriptId: String(transcriptData.id),
      },
      { method: "post", action: "/api/transcript" }
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] p-6">
      {/* Header with count */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-medium text-gray-300">
          Transcript Validation
        </h1>
        <div className="text-sm text-gray-500">
          {pendingCount} remaining
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-6">
        <ListenSection onPlay={handlePlay} audioUrl={transcriptData.audioUrl} />
        <CheckSection
          transcript={editedText}
          onTranscriptChange={setEditedText}
          onCorrect={handleCorrect}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          markedCorrect={markedCorrect}
        />
      </div>
    </div>
  );
}
