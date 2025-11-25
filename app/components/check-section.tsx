interface CheckSectionProps {
  transcript: string;
  onCorrect?: () => void;
  onEdit?: () => void;
}

export function CheckSection({ transcript, onCorrect, onEdit }: CheckSectionProps) {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-black text-xl font-semibold mb-4">Check</h2>
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 p-6">
        {/* Text Content */}
        <div className="flex-1 mb-6">
          <p className="text-black text-base leading-relaxed">
            {transcript}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCorrect}
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
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            Correct
          </button>
          <button
            onClick={onEdit}
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
      </div>
    </div>
  );
}

