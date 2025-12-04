import { useState, useEffect, useRef } from "react";

interface CheckSectionProps {
  transcript: string;
  onTranscriptChange?: (value: string) => void;
  onCorrect?: () => void;
  onEdit?: () => void;
  onSubmit?: () => void;
  onSkip?: () => void;
  onTagChange?: (tags: string[]) => void;
}

const TAG_OPTIONS = [
  "developer",
  "designer",
  "manager",
  "tester",
  "analyst",
  "other",
];

export function CheckSection({ transcript, onTranscriptChange, onCorrect, onEdit, onSubmit, onSkip, onTagChange }: CheckSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Sync editedTranscript when transcript prop changes (when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedTranscript(transcript);
      setIsCorrect(false); // Reset correct state when transcript changes
      setSelectedTags([]); // Reset tags when not editing
      setTagSearchQuery(""); // Reset search query
      setIsTagDropdownOpen(false); // Close dropdown
    }
  }, [transcript, isEditing]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };

    if (isTagDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTagDropdownOpen]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedTranscript(transcript);
    onEdit?.();
  };

  const handleSave = () => {
    if (selectedTags.length === 0) {
      alert("Please select at least one tag before saving.");
      return;
    }
    onTranscriptChange?.(editedTranscript);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTranscript(transcript);
    setSelectedTags([]);
    setTagSearchQuery("");
    setIsTagDropdownOpen(false);
    setIsEditing(false);
  };

  const filteredTags = TAG_OPTIONS.filter(tag =>
    tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  const toggleTag = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newSelectedTags);
    onTagChange?.(newSelectedTags);
  };

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearchQuery(e.target.value);
    setIsTagDropdownOpen(true);
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
            <div className="flex flex-col gap-4 h-full">
              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="flex-1 w-full text-black text-base leading-relaxed resize-none border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 bg-white"
                placeholder="Enter or edit transcript..."
              />
              <div className="relative" ref={tagDropdownRef}>
                <label className="block text-sm font-medium text-black mb-2">
                  Tags <span className="text-red-500">*</span>
                </label>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={handleTagSearchChange}
                    onFocus={() => setIsTagDropdownOpen(true)}
                    placeholder="Search tags..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-black text-base bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
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
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredTags.length > 0 ? (
                      <div className="py-1">
                        {filteredTags.map(tag => (
                          <label
                            key={tag}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag)}
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
            </div>
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

