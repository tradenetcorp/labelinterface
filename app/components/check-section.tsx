import { useEffect } from "react";
import type { LabelOption } from "./listen-check";

interface CheckSectionProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  selectedLabels: string[];
  onToggleLabel: (label: string) => void;
  labels: LabelOption[];
}

export function CheckSection({
  transcript,
  onTranscriptChange,
  selectedLabels,
  onToggleLabel,
  labels,
}: CheckSectionProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const key = e.key.toLowerCase();
        const found = labels.find((l) => l.shortcut === key);
        if (found) {
          e.preventDefault();
          onToggleLabel(found.name);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [labels, onToggleLabel]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <h2 className="text-black text-xl font-semibold mb-3">Check</h2>
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 p-4 h-full shadow-sm">
        {/* Text Content */}
        <div className="flex-1 min-h-0 mb-4">
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className="w-full h-full text-black text-lg leading-relaxed resize-none border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 bg-gray-50 placeholder-gray-400"
            placeholder="Type transcript here..."
          />
        </div>

        {/* Labels Toolbar */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {labels.map((label) => {
            const isSelected = selectedLabels.includes(label.name);
            return (
              <button
                key={label.id}
                onClick={() => onToggleLabel(label.name)}
                className={`
                  relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border
                  focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                  ${isSelected
                    ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }
                `}
                title={label.shortcut ? `Press Alt+${label.shortcut.toUpperCase()}` : label.name}
              >
                <div className="flex items-center gap-2">
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {label.name}
                </div>
                <span className="sr-only">{isSelected ? "Selected" : "Not selected"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

