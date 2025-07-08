import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack, Download } from "lucide-react";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { updateBoxSong, getYouTubeAudioSignedUrl } from "@/sdk";
import type { SongRow } from "@/lib/player";
import { motion } from "framer-motion";

export const YouTubePlayer = () => {
  const { songs, currentSongIndex, goToPrevious, goToNext } = useJukebox();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<SongRow | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoplayAttemptedRef = useRef(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPolledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentSongIndex >= 0 && currentSongIndex < songs.length) {
      const nextSong = songs[currentSongIndex] as SongRow;
      setCurrentSong((prev) => {
        if (!prev || prev.id !== nextSong.id) {
          return nextSong;
        }
        return prev;
      });
    } else {
      setCurrentSong(null);
    }
  }, [currentSongIndex, songs]);

  useEffect(() => {
    if (!currentSong || !currentSong.youtube_id) {
      setMediaUrl(null);
      return;
    }
    let cancelled = false;
    setMediaUrl(null);
    setIsLoading(true);
    setIsPlaying(false);
    lastPolledIdRef.current = currentSong.youtube_id;

    const poll = async () => {
      try {
        const result = await getYouTubeAudioSignedUrl(currentSong.youtube_id!);
        if (cancelled || lastPolledIdRef.current !== currentSong.youtube_id)
          return;
        if (result && result.url) {
          setMediaUrl(result.url);
          setIsLoading(false);
        } else {
          setIsLoading(true);
          setMediaUrl(null);
          pollTimeoutRef.current = setTimeout(poll, 2000);
        }
      } catch (e: unknown) {
        console.error("Failed to get YouTube audio signed URL:", e);
        setIsLoading(true);
        setMediaUrl(null);
      }
    };
    poll();
    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      const newAudio = new Audio();
      newAudio.crossOrigin = "anonymous";
      newAudio.preload = "auto";
      audioRef.current = newAudio;
    }

    if (mediaUrl && audioRef.current && audioRef.current.src !== mediaUrl) {
      autoplayAttemptedRef.current = false;
      audioRef.current.src = mediaUrl;
      setDuration(currentSong?.duration ?? 0);
      setCurrentTime(0);
      setIsPlaying(false);
      setIsLoading(true);
    } else if (!mediaUrl) {
      setIsLoading(true);
    }
  }, [mediaUrl, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (isNaN(audio.duration) || audio.duration === 0) {
        console.warn("Invalid audio duration detected");
      }
    };

    const handlePlay = async () => {
      setIsPlaying(true);
      setIsLoading(false);

      if (currentSong?.id) {
        try {
          await updateBoxSong(currentSong.id, {
            ...currentSong,
            status: "playing",
          });
        } catch (error) {
          console.error("Failed to update song status to playing:", error);
        }
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = async () => {
      setIsPlaying(false);

      if (currentSong?.id) {
        try {
          await updateBoxSong(currentSong.id, {
            ...currentSong,
            status: "played",
          });
        } catch (error) {
          console.error("Failed to update song status to played:", error);
        }
      }

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
      if (hasInteracted && !autoplayAttemptedRef.current) {
        autoplayAttemptedRef.current = true;
        audio.play().catch((e) => {
          console.error("Autoplay was prevented.", e);
        });
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error("Audio playback error");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

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
  }, [currentSongIndex, songs.length, goToNext, hasInteracted, currentSong]);

  const handlePlayPause = useCallback(async () => {
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
      }
    }
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0 || isLoading) return;

    if (audio.readyState < 2) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    const clampedTime = Math.max(0, Math.min(duration, newTime));

    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }

    setCurrentTime(clampedTime);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space" && !e.repeat && currentSong && !isLoading) {
        e.preventDefault();
        handlePlayPause();
        return;
      }

      if (
        (e.metaKey || e.ctrlKey) &&
        e.code === "ArrowLeft" &&
        !e.repeat &&
        currentSong
      ) {
        e.preventDefault();
        goToPrevious();
        return;
      }

      if (
        (e.metaKey || e.ctrlKey) &&
        e.code === "ArrowRight" &&
        !e.repeat &&
        currentSong
      ) {
        e.preventDefault();
        goToNext();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentSong,
    isLoading,
    isPlaying,
    handlePlayPause,
    goToPrevious,
    goToNext,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="bg-white text-foreground">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Crossfade between no-song and player UI */}
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {currentSong ? (
                <motion.div
                  key="player"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    preload="auto"
                    crossOrigin="anonymous"
                  />
                  {/* Song Info + Download Button (top right) */}
                  <div className="flex items-start gap-4 relative">
                    {currentSong.thumbnail_url && (
                      <img
                        src={currentSong.thumbnail_url}
                        alt={currentSong?.title ?? "Song Thumbnail"}
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
                    {/* Download button, only show if mediaUrl is available */}
                    {mediaUrl && (
                      <a
                        href={mediaUrl}
                        download={
                          currentSong?.title
                            ? `${currentSong.title}.mp3`
                            : undefined
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-0 top-0 ml-2"
                        title="Download audio"
                      >
                        <Button variant="neutral" size="sm" type="button">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                  {/* Progress Bar */}
                  <div className="space-y-2 mt-4">
                    <div
                      className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div
                        className="bg-main h-2 rounded-full transition-all duration-100"
                        style={{
                          width:
                            duration > 0
                              ? `${(currentTime / duration) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  {/* Player Controls */}
                  <div className="flex items-center justify-center gap-4 mt-4">
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
                  {/* Playlist Info */}
                  <div className="text-center text-sm text-gray-600 mt-4">
                    Playing {currentSongIndex + 1} of {songs.length}
                  </div>
                  {/* User interaction message */}
                  {!hasInteracted && !isPlaying && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                      className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4"
                    >
                      <p className="font-medium">Ready to play!</p>
                      <p>
                        Click the play button above to start listening to your
                        jukebox.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="no-song"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-center text-gray-500 flex flex-col items-center justify-center min-h-[180px]">
                    <p>No playable songs in this playlist</p>
                    <p className="text-sm mt-2">
                      Please add songs to your jukebox to start listening.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default YouTubePlayer;
