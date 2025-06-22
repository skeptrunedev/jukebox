import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SongTable, type Column } from "@/components/SongTable";
import {
  getBoxSongs,
  getSongs,
  createSong,
  createBoxSong,
  updateBoxSong,
  getBox,
} from "@/sdk";
import YouTubePlayer from "@/components/YouTubePlayer";
import SongSearch from "@/components/SongSearch";
import { Copy, Check, X, Play, Clock } from "lucide-react";
import { type SongRow, usePlayerSongs } from "@/lib/player";

export default function PlayPage() {
  const { boxSlug } = useParams<{ boxSlug: string }>();
  const [rows, setRows] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState<React.ReactNode>(
    <>
      <Copy className="w-4 h-4 mr-1" />
      Copy
    </>
  );
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [box, setBox] = useState<
    { id?: string; name?: string; slug?: string } | undefined
  >(undefined);

  const shareUrl = `${window.location.origin}/share/${boxSlug}`;

  // Convert rows into player-ready song objects
  const memoizedSongs = usePlayerSongs(rows);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyButtonText(
        <>
          <Check className="w-4 h-4 mr-1" />
          Copied
        </>
      );
      setTimeout(
        () =>
          setCopyButtonText(
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          ),
        2000
      );
    } catch (error) {
      console.error("Failed to copy URL:", error);
      setCopyButtonText(
        <>
          <X className="w-4 h-4 mr-1" />
          Failed
        </>
      );
      setTimeout(
        () =>
          setCopyButtonText(
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          ),
        2000
      );
    }
  };

  const handleYouTubeSongSelect = async (songData: {
    title: string;
    artist: string;
    youtube_id: string;
    youtube_url: string;
    thumbnail_url: string;
    duration: number;
  }) => {
    if (!boxSlug) return;

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
        box_id: boxSlug,
        song_id: song.id || "",
        position: rows.length,
        status: "queued",
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
          status: relation.status ?? "queued",
        },
      ]);
    } catch (error) {
      console.error("Error adding YouTube song:", error);
      throw error; // Re-throw so the loading state can be handled properly
    }
  };

  const handleStatusUpdate = useCallback(
    async (songId: string, status: "queued" | "playing" | "played") => {
      try {
        await updateBoxSong(songId, { status });
        // Update local state to reflect the change
        setRows((prevRows) =>
          prevRows.map((row) => (row.id === songId ? { ...row, status } : row))
        );
      } catch (error) {
        console.error("Error updating song status:", error);
      }
    },
    []
  );

  useEffect(() => {
    if (!boxSlug) return;

    const fetchBox = async () => {
      try {
        const box = await getBox(boxSlug);
        setBox(box);
      } catch (error) {
        console.error("Error loading box data:", error);
        setBox(undefined);
      }
    };

    fetchBox();
  }, [boxSlug]);

  // Initial load and polling setup
  useEffect(() => {
    if (!boxSlug) return;
    if (!box?.id) return;

    const fetchSongs = async (isInitialLoad = false) => {
      try {
        const [boxSongs, songs] = await Promise.all([
          getBoxSongs(),
          getSongs(),
        ]);
        const filtered = boxSongs
          .filter((bs) => bs.box_id === box.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const songMap = new Map(songs.map((s) => [s.id, s]));
        const newRows = filtered.map((bs) => ({
          id: bs.id || "",
          position: bs.position ?? 0,
          title: songMap.get(bs.song_id || "")?.title,
          artist: songMap.get(bs.song_id || "")?.artist,
          youtube_id: songMap.get(bs.song_id || "")?.youtube_id,
          youtube_url: songMap.get(bs.song_id || "")?.youtube_url,
          thumbnail_url: songMap.get(bs.song_id || "")?.thumbnail_url,
          duration: songMap.get(bs.song_id || "")?.duration,
          status: bs.status ?? "queued",
        }));

        setRows((prevRows) => {
          const existingIds = new Set(prevRows.map((row) => row.id));
          const newIds = new Set(newRows.map((row) => row.id));

          // Keep existing rows that still exist in new data
          const keptRows = prevRows.filter((row) => newIds.has(row.id));

          // Add only genuinely new rows
          const addedRows = newRows.filter((row) => !existingIds.has(row.id));

          return [...keptRows, ...addedRows];
        });

        // Only update loading state on initial load
        if (isInitialLoad) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading box data:", error);
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    fetchSongs(true); // Initial load

    // Set up polling every 2 seconds (more reasonable than 100ms)
    const intervalId = setInterval(() => {
      fetchSongs(false); // Polling updates
    }, 2000);

    // Cleanup interval on unmount or boxSlug change
    return () => {
      clearInterval(intervalId);
    };
  }, [box?.id, boxSlug]);

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
        <YouTubePlayer
          songs={memoizedSongs}
          currentSongIndex={currentSongIndex}
          onSongChange={setCurrentSongIndex}
          onStatusUpdate={handleStatusUpdate}
        />

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
              <SongTable
                rows={rows}
                columns={
                  [
                    { header: "#", cell: (_, i) => i + 1 },
                    { header: "Title", cell: (r) => r.title },
                    { header: "Artist", cell: (r) => r.artist },
                    {
                      header: "Duration",
                      cell: (r) =>
                        r.duration
                          ? `${Math.floor(r.duration / 60)}:${(r.duration % 60)
                              .toString()
                              .padStart(2, "0")}`
                          : "-",
                    },
                    {
                      header: "Status",
                      cell: (r) =>
                        r.status === "playing" ? (
                          <>
                            <Play className="w-4 h-4 mr-1 inline" /> Playing
                          </>
                        ) : r.status === "played" ? (
                          <>
                            <Check className="w-4 h-4 mr-1 inline" /> Played
                          </>
                        ) : r.status === "queued" ? (
                          <>
                            <Clock className="w-4 h-4 mr-1 inline" /> Queued
                          </>
                        ) : null,
                    },
                  ] as Column<SongRow>[]
                }
                getRowProps={(r, i) => ({
                  key: r.id,
                  className: i === currentSongIndex ? "bg-blue-50" : undefined,
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
