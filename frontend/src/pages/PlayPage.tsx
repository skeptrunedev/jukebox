import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getBoxSongs, getSongs, createSong, createBoxSong } from "@/sdk";
import YouTubePlayer from "@/components/YouTubePlayer";
import SongSearch from "@/components/SongSearch";

interface SongRow {
  id: string;
  position: number;
  title?: string;
  artist?: string | null;
  youtube_id?: string | null;
  youtube_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
}

export default function PlayPage() {
  const { boxId } = useParams<{ boxId: string }>();
  const [rows, setRows] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState("📋 Copy");
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const shareUrl = `${window.location.origin}/share/${boxId}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyButtonText("✅ Copied");
      setTimeout(() => setCopyButtonText("📋 Copy"), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      setCopyButtonText("❌ Failed");
      setTimeout(() => setCopyButtonText("📋 Copy"), 2000);
    }
  };

  const fetchSongs = useCallback(async () => {
    if (!boxId) return;

    try {
      const [boxSongs, songs] = await Promise.all([getBoxSongs(), getSongs()]);
      const filtered = boxSongs
        .filter((bs) => bs.box_id === boxId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const songMap = new Map(songs.map((s) => [s.id, s]));
      setRows(
        filtered.map((bs) => ({
          id: bs.id || "",
          position: bs.position ?? 0,
          title: songMap.get(bs.song_id || "")?.title,
          artist: songMap.get(bs.song_id || "")?.artist,
          youtube_id: songMap.get(bs.song_id || "")?.youtube_id,
          youtube_url: songMap.get(bs.song_id || "")?.youtube_url,
          thumbnail_url: songMap.get(bs.song_id || "")?.thumbnail_url,
          duration: songMap.get(bs.song_id || "")?.duration,
        }))
      );
    } catch (error) {
      console.error("Error loading box data:", error);
    } finally {
      setLoading(false);
    }
  }, [boxId]);

  const handleYouTubeSongSelect = async (songData: {
    title: string;
    artist: string;
    youtube_id: string;
    youtube_url: string;
    thumbnail_url: string;
    duration: number;
  }) => {
    if (!boxId) return;

    try {
      const song = await createSong({
        title: songData.title,
        artist: songData.artist,
        youtube_id: songData.youtube_id,
        youtube_url: songData.youtube_url,
        thumbnail_url: songData.thumbnail_url,
        duration: songData.duration,
      });
      const relation = await createBoxSong({
        box_id: boxId,
        song_id: song.id || "",
        position: rows.length,
      });
      setRows((prev) => [
        ...prev,
        {
          id: relation.id || "",
          position: relation.position ?? 0,
          title: song.title,
          artist: song.artist,
          youtube_id: song.youtube_id,
          youtube_url: song.youtube_url,
          thumbnail_url: song.thumbnail_url,
          duration: song.duration,
        },
      ]);
    } catch (error) {
      console.error("Error adding YouTube song:", error);
      throw error; // Re-throw so the loading state can be handled properly
    }
  };

  // Initial load and polling setup
  useEffect(() => {
    if (!boxId) return;

    setLoading(true);
    fetchSongs();

    // Set up polling every 100ms
    const intervalId = setInterval(() => {
      fetchSongs();
    }, 100);

    // Cleanup interval on unmount or boxId change
    return () => {
      clearInterval(intervalId);
    };
  }, [boxId, fetchSongs]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-1 items-center justify-center p-5 w-full bg-background/40">
      <div className="mx-auto w-[1300px] max-w-full space-y-6">
        {/* Share Section Card */}
        <Card className="bg-white text-foreground">
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Share this Jukebox</h3>
              <p className="text-sm text-muted-foreground">
                Share this link so others can add songs to this jukebox
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="neutral"
                  size="sm"
                  className="w-24 text-left"
                >
                  {copyButtonText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* YouTube Player Card */}
        {rows.length > 0 && (
          <YouTubePlayer
            songs={rows.map((row) => ({
              id: row.id,
              title: row.title,
              artist: row.artist || undefined,
              youtube_id: row.youtube_id || undefined,
              youtube_url: row.youtube_url || undefined,
              thumbnail_url: row.thumbnail_url || undefined,
              duration: row.duration || undefined,
            }))}
            currentSongIndex={currentSongIndex}
            onSongChange={setCurrentSongIndex}
          />
        )}

        {/* Add Songs Card */}
        <Card className="bg-white text-foreground">
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Add Songs</h3>
              <p className="text-sm text-muted-foreground">
                Search for songs on YouTube to add to your jukebox
              </p>
              <SongSearch onSongSelect={handleYouTubeSongSelect} />
            </div>
          </CardContent>
        </Card>

        {/* Songs Table Card */}
        <Card className="bg-white text-foreground">
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Current Playlist</h3>
              <p className="text-sm text-muted-foreground">
                Songs currently in this jukebox playlist
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      className={idx === currentSongIndex ? "bg-blue-50" : ""}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>{row.artist}</TableCell>
                      <TableCell>
                        {row.duration
                          ? `${Math.floor(row.duration / 60)}:${(
                              row.duration % 60
                            )
                              .toString()
                              .padStart(2, "0")}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {row.youtube_id ? (
                          <span className="text-green-600 text-sm">
                            🎵 Playable
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            📝 Manual entry
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
