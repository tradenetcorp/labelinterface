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
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const fetcher = useFetcher();


  const formData = fetcher.formData;
  const currentAction = formData?.get("action")?.toString();
  const isNavigating = fetcher.state !== "idle" && (currentAction === "submit" || currentAction === "skip");

  // Reset state when transcript changes
  const transcriptId = transcriptData?.id;
  const [lastTranscriptId, setLastTranscriptId] = useState(transcriptId);
  if (transcriptId !== lastTranscriptId) {
    setLastTranscriptId(transcriptId);
    setEditedText(transcriptData?.originalText ?? "");
    setMarkedCorrect(false);
    setSelectedLabels([]);
    setTagSearchQuery("");
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

  const TAG_OPTIONS = [
    "Male",
    "Female",
    "Dhivehi",
    "English",
    "analyst",
    "other",
  ];

  const filteredTags = TAG_OPTIONS.filter(tag =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  const toggleTag = (tag: string) => {
    const newSelectedTags = selectedLabels.includes(tag)
      ? selectedLabels.filter(t => t !== tag)
      : [...selectedLabels, tag];
    setSelectedLabels(newSelectedTags);
  };

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearchQuery(e.target.value);
    setIsTagDropdownOpen(true);
  };

  const handleSubmit = () => {
    fetcher.submit(
      {
        action: "submit",
        transcriptId: String(transcriptData.id),
        transcript: editedText,
        originalTranscript: transcriptData.originalText,
        markedCorrect: String(markedCorrect),
        labels: JSON.stringify(selectedLabels),
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

  if (isNavigating) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-1 flex flex-col p-6 pb-24 overflow-y-auto">
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
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Tag Selection */}
          <div className="relative w-64">
            <div className="relative">
              <input
                type="text"
                value={tagSearchQuery}
                onChange={handleTagSearchChange}
                onFocus={() => setIsTagDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsTagDropdownOpen(false), 200)}
                placeholder="Search tags..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-black text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Selected Tags Display */}
            {selectedLabels.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-2">
                {selectedLabels.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs shadow-sm"
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:text-blue-600 focus:outline-none"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Dropdown Options */}
            {isTagDropdownOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredTags.length > 0 ? (
                  <div className="py-1">
                    {filteredTags.map(tag => (
                      <label
                        key={tag}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                      >
                        <input
                          type="checkbox"
                          checked={selectedLabels.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-black text-sm">
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    No tags found
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-black font-medium text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Skip
            </button>

            <button
              onClick={handleCorrect}
              className={`px-6 py-2.5 rounded-lg border transition-colors font-medium text-sm flex items-center gap-2 ${markedCorrect
                ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                : "border-gray-300 bg-white hover:bg-gray-50 text-black"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Correct
            </button>

            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
