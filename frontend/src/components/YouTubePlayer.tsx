import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { useJukebox } from "@/hooks/useJukeboxContext";

export const YouTubePlayer = () => {
  const { songs, currentSongIndex, mediaMap, goToPrevious, goToNext } =
    useJukebox();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSong = useMemo(() => {
    return songs[currentSongIndex];
  }, [songs, currentSongIndex]);

  useEffect(() => {
    if (songs.length === 0) return;

    const currentSong = songs[currentSongIndex];
    if (!currentSong || !currentSong.youtube_id) return;

    const audio = audioRef.current;
    if (!audio) {
      const newAudio = new Audio();
      newAudio.crossOrigin = "anonymous";
      audioRef.current = newAudio;
    }

    const mediaUrl = mediaMap[currentSong.youtube_id];
    if (mediaUrl && audioRef.current) {
      // Only update the src if it's different from the current src
      if (audioRef.current.src !== mediaUrl) {
        audioRef.current.src = mediaUrl;
        setDuration(currentSong.duration ?? 0);
        setCurrentTime(0);
        setIsPlaying(false);
        setIsLoading(true);
      }
    } else {
      console.warn("No media URL found for song:", currentSong.title);
    }
  }, [songs, currentSongIndex, mediaMap]);

  // Audio event listeners effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded:", audio.duration);
      setDuration(audio.duration);
      if (isNaN(audio.duration) || audio.duration === 0) {
        console.warn("Invalid audio duration detected");
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next song if available
      if (currentSongIndex < songs.length - 1) {
        goToNext();
        setCurrentTime(0);
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error("Audio playback error");
    };

    // Add event listeners
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    // Cleanup function
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [currentSongIndex, songs.length, goToNext]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        setHasInteracted(true);
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Playback failed:", error);
        // The error will be handled by the audio error event listener
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0 || isLoading) return;

    // Prevent seeking if audio is not ready
    if (audio.readyState < 2) return; // HAVE_CURRENT_DATA or higher

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width)); // Clamp between 0 and 1
    const newTime = percentage * duration;

    // Ensure the new time is within valid bounds
    const clampedTime = Math.max(0, Math.min(duration, newTime));

    // Clear any existing seek timeout
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    setCurrentTime(clampedTime); // Update UI immediately

    try {
      audio.currentTime = clampedTime;
      console.log(
        "Seeking to:",
        clampedTime,
        "seconds",
        "of duration:",
        duration
      );

      seekTimeoutRef.current = setTimeout(() => {
        if (Math.abs(audio.currentTime - clampedTime) > 1) {
          console.warn(
            "Seek may have failed, actual time:",
            audio.currentTime,
            "expected:",
            clampedTime
          );
          setCurrentTime(audio.currentTime);
        }
      }, 500);
    } catch (error) {
      console.error("Seek failed:", error);
      setCurrentTime(audio.currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong) {
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
              <h3
                className="font-semibold text-lg"
                dangerouslySetInnerHTML={{
                  __html: currentSong.title ?? "Unknown Title",
                }}
              />
              <p
                className="text-gray-600"
                dangerouslySetInnerHTML={{
                  __html: currentSong.artist ?? "Unknown Artist",
                }}
              />
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
              onClick={goToPrevious}
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
              onClick={goToNext}
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
};

export default YouTubePlayer;
