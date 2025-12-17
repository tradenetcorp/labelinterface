import { useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
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
  const revalidator = useRevalidator();
  const isLoading = fetcher.state !== "idle" || revalidator.state === "loading";

  // Reset state when transcript changes
  const transcriptId = transcriptData?.id;
  const [lastTranscriptId, setLastTranscriptId] = useState(transcriptId);
  if (transcriptId !== lastTranscriptId) {
    setLastTranscriptId(transcriptId);
    setEditedText(transcriptData?.originalText ?? "");
    setMarkedCorrect(false);
  }

  // Empty state - no more transcripts to review
  if (!transcriptData) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-semibold text-gray-200">All caught up!</h2>
          <p className="text-gray-400">
            No more transcripts to review. Check back later or import new ones.
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500">Logged in as {userEmail}</p>
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
    // Edit is handled locally in CheckSection, no API call needed
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
