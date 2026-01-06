import { useRef, useEffect } from "react";

interface CheckSectionProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
}

export function CheckSection({ transcript, onTranscriptChange }: CheckSectionProps) {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-black text-xl font-semibold mb-4">Check</h2>
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 p-6 h-full">
        {/* Text Content */}
        <div className="flex-1 h-full">
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className="w-full h-full text-black text-base leading-relaxed resize-none border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 bg-white"
            placeholder="Enter or edit transcript..."
          />
        </div>
      </div>
    </div>
  );
}

