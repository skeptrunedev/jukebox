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
import {
  getBox,
  getBoxSongs,
  getSongs,
  createSong,
  createBoxSong,
} from "@/sdk";
import SongSearch from "@/components/SongSearch";

interface SongRow {
  id: string;
  position: number;
  title?: string;
  artist?: string | null;
}

export default function SharePage() {
  const { boxId } = useParams<{ boxId: string }>();
  const [boxName, setBoxName] = useState("");
  const [rows, setRows] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boxId) return;
    setLoading(true);
    (async () => {
      try {
        const [box, boxSongs, songs] = await Promise.all([
          getBox(boxId),
          getBoxSongs(),
          getSongs(),
        ]);
        setBoxName(box.name ?? "");
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
          }))
        );
      } catch (error) {
        console.error("Error loading share data:", error);
      } finally {
        setLoading(false);
      }
    })();
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
          <h2 className="text-2xl font-bold">Add Songs to "{boxName}"</h2>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>{row.artist}</TableCell>
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
