import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack, Lightbulb } from "lucide-react";

// YouTube API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string;
          width: string;
          videoId: string;
          playerVars: Record<string, number>;
          events: {
            onReady: (event: { target: YTPlayer }) => void;
            onStateChange: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface Song {
  id: string; // box_song id
  title?: string;
  artist?: string;
  youtube_id?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  duration?: number;
  status?: "queued" | "playing" | "played";
}

interface YouTubePlayerProps {
  songs: Song[];
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
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const apiLoadedRef = useRef<boolean>(false);
  const currentSong = songs[currentSongIndex];

  // Track the current video ID to avoid unnecessary re-initializations
  const currentVideoIdRef = useRef<string>("");

  const handleNext = useCallback(() => {
    if (currentSongIndex < songs.length - 1) {
      const nextIndex = currentSongIndex + 1;
      onSongChange(nextIndex);
    }
  }, [currentSongIndex, songs.length, onSongChange]);

  const handlePrevious = useCallback(() => {
    if (currentSongIndex > 0) {
      const prevIndex = currentSongIndex - 1;
      onSongChange(prevIndex);
    }
  }, [currentSongIndex, onSongChange]);

  // Memoize handleStatusUpdate to prevent unnecessary re-renders
  const stableStatusUpdate = useCallback(
    (songId: string, status: "queued" | "playing" | "played") => {
      if (onStatusUpdate) {
        onStatusUpdate(songId, status);
      }
    },
    [onStatusUpdate]
  );

  const initializePlayer = useCallback(() => {
    if (!currentSong?.youtube_id) return;

    // Don't reinitialize if we're already playing the same video
    if (
      currentVideoIdRef.current === currentSong.youtube_id &&
      playerRef.current
    ) {
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    currentVideoIdRef.current = currentSong.youtube_id;

    playerRef.current = new window.YT.Player("youtube-player", {
      height: "100%",
      width: "100%",
      videoId: currentSong.youtube_id,
      playerVars: {
        enablejsapi: 1,
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          setPlayerReady(true);
          // Auto-start playback when player is ready
          event.target.playVideo();
          // Set current song as playing when player is ready
          if (currentSong) {
            stableStatusUpdate(currentSong.id, "playing");
          }
        },
        onStateChange: (event) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            if (currentSong) {
              stableStatusUpdate(currentSong.id, "playing");
            }
          } else if (state === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (state === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            if (currentSong) {
              stableStatusUpdate(currentSong.id, "played");
            }
            // Auto-advance to next song
            handleNext();
          }
        },
      },
    });
  }, [currentSong, stableStatusUpdate, handleNext]);

  // Load YouTube IFrame API (only once)
  useEffect(() => {
    // Check if YouTube API is already loaded
    if (window.YT) {
      apiLoadedRef.current = true;
      return;
    }

    // Check if script is already being loaded
    if (
      document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    ) {
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Global callback for when API is ready
    window.onYouTubeIframeAPIReady = () => {
      apiLoadedRef.current = true;
    };

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []); // Empty dependency array - this should only run once

  // Initialize player when song changes or YouTube API becomes available
  useEffect(() => {
    if ((window.YT || apiLoadedRef.current) && currentSong?.youtube_id) {
      initializePlayer();
    }
  }, [currentSong?.youtube_id, initializePlayer]);

  const handlePlayPause = () => {
    if (!playerRef.current || !playerReady) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
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
          {/* Ad Block Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-base p-3">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <strong>Tip:</strong> Use a browser like Brave or install an
              adblocker to avoid YouTube ads during playback.
            </p>
          </div>

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

          {/* YouTube Embed */}
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <div id="youtube-player" className="w-full h-full"></div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="neutral"
              size="sm"
              onClick={handlePrevious}
              disabled={songs.length <= 1}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant="neutral"
              size="sm"
              onClick={handleNext}
              disabled={songs.length <= 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Playlist Info */}
          <div className="text-center text-sm text-gray-600">
            Playing {currentSongIndex + 1} of {songs.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
