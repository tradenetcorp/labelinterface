import { useState, useRef } from "react";
import { useFetcher } from "react-router";
import { ListenSection } from "./listen-section";
import { CheckSection } from "./check-section";
import { LoadingScreen } from "./loading-screen";

interface ListenCheckProps {
  userId?: number;
  userEmail?: string;
}

export function ListenCheck({ userId, userEmail }: ListenCheckProps) {
  const originalTranscript = "在古晋我们现在在equoternal的天气这equal Ternal 也没有什么啦也没有什么四个season 都 没有啦只有说热下雨整年都是";
  const [transcript, setTranscript] = useState(originalTranscript);
  const [markedCorrect, setMarkedCorrect] = useState(false);
  const transcriptIdRef = useRef(`transcript-${Date.now()}`);
  
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const handlePlay = () => {
    fetcher.submit(
      {
        action: "play",
        transcriptId: transcriptIdRef.current,
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
        transcriptId: transcriptIdRef.current,
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
        transcriptId: transcriptIdRef.current,
        transcript: transcript,
        originalTranscript: originalTranscript,
      },
      { method: "post", action: "/api/transcript" }
    );
  };

  const handleSkip = () => {
    fetcher.submit(
      {
        action: "skip",
        transcriptId: transcriptIdRef.current,
      },
      { method: "post", action: "/api/transcript" }
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 p-6">
      <ListenSection onPlay={handlePlay} />
      <CheckSection
        transcript={transcript}
        onTranscriptChange={setTranscript}
        onCorrect={handleCorrect}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
      />
    </div>
  );
}
