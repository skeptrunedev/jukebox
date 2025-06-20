import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getBoxSongs, getSongs, createSong, createBoxSong } from "@/sdk";
import SongSearch from "@/components/SongSearch";
import { Check, Clock, Play } from "lucide-react";

interface SongRow {
  id: string;
  position: number;
  title?: string;
  artist?: string | null;
  youtube_id?: string | null;
  youtube_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  status?: "queued" | "playing" | "played";
}

export default function SharePage() {
  const { boxId } = useParams<{ boxId: string }>();
  const [rows, setRows] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boxId) return;

    const fetchSongs = async (isInitialLoad = false) => {
      try {
        const [boxSongs, songs] = await Promise.all([
          getBoxSongs(),
          getSongs(),
        ]);
        const filtered = boxSongs
          .filter((bs) => bs.box_id === boxId)
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

    // Cleanup interval on unmount or boxId change
    return () => {
      clearInterval(intervalId);
    };
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
        status: "queued",
      });
      setRows((prev) => [
        ...prev,
        {
          id: relation.id || "",
          position: relation.position ?? 0,
          title: song.title,
          artist: song.artist,
          status: relation.status ?? "queued",
        },
      ]);
    } catch (error) {
      console.error("Error adding YouTube song:", error);
      throw error; // Re-throw so the loading state can be handled properly
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-1 items-center justify-center p-5 w-full bg-background/40">
      <div className="mx-auto w-[1300px] max-w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Add Songs to the Jukebox</h2>
        </div>

        {/* Add Songs Card */}
        <Card className="bg-white text-foreground">
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Add Songs</h3>
              <p className="text-sm text-muted-foreground">
                Search for songs on YouTube to add to this jukebox
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
                    <TableRow key={row.id}>
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
                        {row.status === "playing" && (
                          <>
                            <Play className="w-4 h-4 mr-1 inline" />
                            Playing
                          </>
                        )}
                        {row.status === "played" && (
                          <>
                            <Check className="w-4 h-4 mr-1 inline" />
                            Played
                          </>
                        )}
                        {row.status === "queued" && (
                          <>
                            <Clock className="w-4 h-4 mr-1 inline" />
                            Queued
                          </>
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
