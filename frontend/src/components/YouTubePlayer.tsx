import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

interface Song {
  id: string;
  title?: string;
  artist?: string;
  youtube_id?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  duration?: number;
}

interface YouTubePlayerProps {
  songs: Song[];
  currentSongIndex: number;
  onSongChange: (index: number) => void;
}

export default function YouTubePlayer({
  songs,
  currentSongIndex,
  onSongChange,
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const currentSong = songs[currentSongIndex];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // YouTube API integration would go here
  };

  const handleNext = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    onSongChange(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex =
      currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    onSongChange(prevIndex);
  };

  if (!currentSong || !currentSong.youtube_id) {
    return (
      <Card className="bg-white text-foreground">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No playable songs in this playlist</p>
            <p className="text-sm mt-2">
              Songs need YouTube URLs to be playable
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
            <iframe
              src={`https://www.youtube.com/embed/${
                currentSong.youtube_id
              }?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1`}
              title={currentSong.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
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
