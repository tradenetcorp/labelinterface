import { useRef, useState, useEffect } from "react";

interface ListenSectionProps {
  onPlay?: () => void;
  audioUrl?: string | null;
}

export function ListenSection({ onPlay, audioUrl }: ListenSectionProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reset state when audio URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback failed:", err);
        setError("Failed to play audio");
      });
      onPlay?.(); // Log play action
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleError = () => {
    setError("Failed to load audio file");
    setIsPlaying(false);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-gray-200 text-xl font-semibold mb-4">Listen</h2>
      <div className="flex-1 relative rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
        {/* Wavy background pattern */}
        <div className="absolute inset-0 opacity-40">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 400"
            preserveAspectRatio="none"
          >
            <path
              d="M0,200 Q100,150 200,200 T400,200 L400,400 L0,400 Z"
              fill="rgba(59, 130, 246, 0.4)"
            />
            <path
              d="M0,250 Q150,200 300,250 T400,250 L400,400 L0,400 Z"
              fill="rgba(139, 92, 246, 0.4)"
            />
            <path
              d="M0,300 Q120,250 240,300 T400,300 L400,400 L0,400 Z"
              fill="rgba(59, 130, 246, 0.3)"
            />
          </svg>
        </div>

        {/* Hidden audio element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={handleError}
            preload="metadata"
          />
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          {/* Error state */}
          {error && (
            <div className="text-red-400 text-sm mb-4 text-center">{error}</div>
          )}

          {/* No audio state */}
          {!audioUrl && !error && (
            <div className="text-gray-400 text-sm mb-4 text-center">
              No audio available
            </div>
          )}

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            disabled={!audioUrl}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              audioUrl
                ? "bg-white/10 border-2 border-violet-500 hover:bg-violet-500/20 cursor-pointer"
                : "bg-gray-700/50 border-2 border-gray-600 cursor-not-allowed"
            }`}
          >
            {isPlaying ? (
              <svg
                className="w-8 h-8 text-violet-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className={`w-8 h-8 ml-1 ${audioUrl ? "text-violet-400" : "text-gray-500"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Progress bar and time */}
          {audioUrl && duration > 0 && (
            <div className="w-full max-w-xs mt-6 space-y-2">
              {/* Time display */}
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Progress slider */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(139, 92, 246) ${progress}%, rgb(75, 85, 99) ${progress}%)`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
