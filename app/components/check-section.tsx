import { useState, useEffect } from "react";

interface CheckSectionProps {
  transcript: string;
  onTranscriptChange?: (value: string) => void;
  onCorrect?: () => void;
  onEdit?: () => void;
  onSubmit?: () => void;
  onSkip?: () => void;
}

export function CheckSection({ transcript, onTranscriptChange, onCorrect, onEdit, onSubmit, onSkip }: CheckSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [isCorrect, setIsCorrect] = useState(false);

  // Sync editedTranscript when transcript prop changes (when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedTranscript(transcript);
      setIsCorrect(false); // Reset correct state when transcript changes
    }
  }, [transcript, isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedTranscript(transcript);
    onEdit?.();
  };

  const handleSave = () => {
    onTranscriptChange?.(editedTranscript);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTranscript(transcript);
    setIsEditing(false);
  };

  const handleCorrect = () => {
    setIsCorrect(true);
    onCorrect?.();
  };

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-black text-xl font-semibold mb-4">Check</h2>
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 p-6">
        {/* Text Content */}
        <div className="flex-1 mb-6">
          {isEditing ? (
            <textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="w-full h-full text-black text-base leading-relaxed resize-none border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 bg-white"
              placeholder="Enter or edit transcript..."
            />
          ) : (
            <p className="text-black text-base leading-relaxed">
              {transcript}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {isEditing ? (
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-black font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <button
                  onClick={handleCorrect}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border transition-colors font-medium ${
                    isCorrect
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                      : "border-gray-300 bg-white hover:bg-gray-50 text-black"
                  }`}
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
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  Correct
                </button>
                <button
                  onClick={handleEditClick}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-black font-medium"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={onSkip}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-black font-medium"
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
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                  Skip
                </button>
                <button
                  onClick={onSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

