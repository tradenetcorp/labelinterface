interface ListenSectionProps {
  onPlay?: () => void;
}

export function ListenSection({ onPlay }: ListenSectionProps) {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-black text-xl font-semibold mb-4">Listen</h2>
      <div className="flex-1 relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-200 via-purple-200 to-blue-300">
        {/* Wavy background pattern */}
        <div className="absolute inset-0 opacity-60">
          <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
            <path
              d="M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z"
              fill="rgba(147, 197, 253, 0.4)"
            />
            <path
              d="M0,250 Q150,200 300,250 T400,250 L400,400 L0,400 Z"
              fill="rgba(196, 181, 253, 0.4)"
            />
            <path
              d="M0,300 Q120,250 240,300 T400,300 L400,400 L0,400 Z"
              fill="rgba(147, 197, 253, 0.3)"
            />
          </svg>
        </div>
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onPlay}
            className="w-20 h-20 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center hover:bg-purple-50 transition-colors shadow-lg"
          >
            <svg
              className="w-8 h-8 text-purple-500 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

