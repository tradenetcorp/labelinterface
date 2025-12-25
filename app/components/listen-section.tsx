import { useRef, useState, useEffect, useCallback } from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  
  // Track URLs to prevent unnecessary resets when only presigned signature changes
  const prevAudioUrlRef = useRef<string | null | undefined>(undefined);
  const [stableAudioUrl, setStableAudioUrl] = useState<string | null>(audioUrl ?? null);
  
  // Helper to extract base URL without query string (for presigned URL comparison)
  const getBaseUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url.split('?')[0];
    }
  };

  // Reset state and reload audio when the actual FILE changes (ignore signature changes)
  useEffect(() => {
    const prevBase = getBaseUrl(prevAudioUrlRef.current);
    const newBase = getBaseUrl(audioUrl);
    
    // Skip if the base URL (file path) hasn't changed - only signature changed
    if (prevBase === newBase && prevBase !== null) {
      return;
    }
    
    prevAudioUrlRef.current = audioUrl;
    setStableAudioUrl(audioUrl ?? null);
    
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsLoading(true);
    setCanPlay(false);
  }, [audioUrl]);
  
  // Separate effect to load audio when stableAudioUrl changes
  useEffect(() => {
    if (audioRef.current && stableAudioUrl) {
      audioRef.current.load();
    }
  }, [stableAudioUrl]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      console.log("No audio element or URL");
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      setIsLoading(true);
      setError(null);
      
      try {
        // Ensure audio is ready before playing
        if (audio.readyState < 2) {
          console.log("Audio not ready, readyState:", audio.readyState);
          audio.load();
          await new Promise<void>((resolve, reject) => {
            const onCanPlay = () => {
              audio.removeEventListener("canplay", onCanPlay);
              audio.removeEventListener("error", onError);
              resolve();
            };
            const onError = () => {
              audio.removeEventListener("canplay", onCanPlay);
              audio.removeEventListener("error", onError);
              reject(new Error("Failed to load audio"));
            };
            audio.addEventListener("canplay", onCanPlay);
            audio.addEventListener("error", onError);
          });
        }

        await audio.play();
        onPlay?.();
      } catch (err) {
        console.error("Audio playback failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        
        if (errorMessage.includes("NotAllowedError") || errorMessage.includes("not allowed")) {
          setError("Playback blocked. Click to enable audio.");
        } else if (errorMessage.includes("NotSupportedError") || errorMessage.includes("not supported")) {
          setError("Audio format not supported");
        } else if (errorMessage.includes("network") || errorMessage.includes("Network")) {
          setError("Network error loading audio");
        } else {
          setError(`Playback failed: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [audioUrl, isPlaying, onPlay]);

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

  const handleCanPlay = () => {
    setCanPlay(true);
    setIsLoading(false);
  };

  const handleCanPlayThrough = () => {
    setIsLoading(false);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
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

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    const mediaError = audio.error;
    
    let errorMessage = "Failed to load audio file";
    if (mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = "Audio loading aborted";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = "Network error while loading audio";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = "Audio decoding error";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = "Audio format not supported";
          break;
      }
      console.error("Audio error:", mediaError.code, mediaError.message);
    }
    
    setError(errorMessage);
    setIsPlaying(false);
    setIsLoading(false);
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

        {/* Hidden audio element - use stableAudioUrl to prevent src changes during playback */}
        {stableAudioUrl && (
          <audio
            ref={audioRef}
            src={stableAudioUrl}
            crossOrigin="anonymous"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onCanPlayThrough={handleCanPlayThrough}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={handleError}
            preload="auto"
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
            disabled={!audioUrl || (isLoading && !isPlaying)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              audioUrl && !isLoading
                ? "bg-white/10 border-2 border-violet-500 hover:bg-violet-500/20 cursor-pointer"
                : audioUrl && isLoading
                ? "bg-white/10 border-2 border-violet-500/50 cursor-wait"
                : "bg-gray-700/50 border-2 border-gray-600 cursor-not-allowed"
            }`}
          >
            {isLoading && !isPlaying ? (
              <svg
                className="w-8 h-8 text-violet-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : isPlaying ? (
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
