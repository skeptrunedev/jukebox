import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { getYouTubeAudioUrl } from "@/sdk";
import type { PlayerSong } from "@/lib/player";

interface YouTubePlayerProps {
  songs: PlayerSong[];
  currentSongIndex: number;
  onSongChange: (index: number) => void;
  onStatusUpdate?: (
    songId: string,
    status: "queued" | "playing" | "played"
  ) => void;
}

export default function YouTubePlayer({
  songs,
  currentSongIndex,
  onSongChange,
  onStatusUpdate,
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSong = songs[currentSongIndex];

  // Memoize handleStatusUpdate to prevent unnecessary re-renders
  const stableStatusUpdate = useCallback(
    (songId: string, status: "queued" | "playing" | "played") => {
      if (onStatusUpdate) {
        onStatusUpdate(songId, status);
      }
    },
    [onStatusUpdate]
  );

  const handleNext = useCallback(() => {
    if (currentSongIndex < songs.length - 1) {
      // Mark current song as played when skipping forward
      if (currentSong) {
        stableStatusUpdate(currentSong.id, "played");
      }
      const nextIndex = currentSongIndex + 1;
      onSongChange(nextIndex);

      // If user has interacted before, continue playing
      if (hasInteracted && isPlaying) {
        // The useEffect will load the new song, and we'll need to play it
        setTimeout(() => {
          const audio = audioRef.current;
          if (audio) {
            audio.play().catch(console.error);
          }
        }, 100);
      }
    }
  }, [
    currentSongIndex,
    songs.length,
    onSongChange,
    currentSong,
    stableStatusUpdate,
    hasInteracted,
    isPlaying,
  ]);

  const handlePrevious = useCallback(() => {
    if (currentSongIndex > 0) {
      // Mark current song as played when skipping backward
      if (currentSong) {
        stableStatusUpdate(currentSong.id, "played");
      }
      const prevIndex = currentSongIndex - 1;
      onSongChange(prevIndex);

      // If user has interacted before, continue playing
      if (hasInteracted && isPlaying) {
        // The useEffect will load the new song, and we'll need to play it
        setTimeout(() => {
          const audio = audioRef.current;
          if (audio) {
            audio.play().catch(console.error);
          }
        }, 100);
      }
    }
  }, [
    currentSongIndex,
    onSongChange,
    currentSong,
    stableStatusUpdate,
    hasInteracted,
    isPlaying,
  ]);

  // Initialize audio element when song changes
  useEffect(() => {
    if (!currentSong?.youtube_id) return;

    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);

    // Set the audio source to the YouTube audio stream
    const audioUrl = getYouTubeAudioUrl(currentSong.youtube_id);
    audio.src = audioUrl;

    // Set up event listeners
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(audio.duration || 0);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => {
      setIsPlaying(true);
      if (currentSong) {
        stableStatusUpdate(currentSong.id, "playing");
      }
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentSong) {
        stableStatusUpdate(currentSong.id, "played");
      }
      // Move to next song when current song ends, but only if user has interacted
      if (hasInteracted && currentSongIndex < songs.length - 1) {
        const nextIndex = currentSongIndex + 1;
        onSongChange(nextIndex);
        // Auto-play next song since user has interacted
        setTimeout(() => {
          const audio = audioRef.current;
          if (audio) {
            audio.play().catch(console.error);
          }
        }, 100);
      }
    };
    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Auto-play when ready - REMOVED to prevent autoplay issues
    audio.load();
    // Don't auto-play - let user interact first

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [
    currentSong,
    stableStatusUpdate,
    currentSongIndex,
    songs.length,
    onSongChange,
    hasInteracted,
  ]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        setHasInteracted(true);
        await audio.play();
      } catch (error) {
        console.error("Playback failed:", error);
        // The error will be handled by the audio error event listener
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong || !currentSong.youtube_id) {
    return (
      <Card className="bg-white text-foreground">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No playable songs in this playlist</p>
            <p className="text-sm mt-2">
              Please add songs to your jukebox to start listening.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white text-foreground">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Hidden audio element */}
          <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />

          {/* Song Info */}
          <div className="flex items-center gap-4">
            {currentSong.thumbnail_url && (
              <img
                src={currentSong.thumbnail_url}
                alt={currentSong.title}
                className="w-16 h-12 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{currentSong.title}</h3>
              <p className="text-gray-600">{currentSong.artist}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div
              className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                style={{
                  width:
                    duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="neutral"
              size="sm"
              onClick={handlePrevious}
              disabled={currentSongIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant="neutral"
              size="sm"
              onClick={handleNext}
              disabled={currentSongIndex === songs.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* User interaction message */}
          {!hasInteracted && !isPlaying && (
            <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="font-medium">Ready to play!</p>
              <p>
                Click the play button above to start listening to your jukebox.
              </p>
            </div>
          )}

          {/* Playlist Info */}
          <div className="text-center text-sm text-gray-600">
            Playing {currentSongIndex + 1} of {songs.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
