import { useState, useEffect } from "react";
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
import { getBoxSongs, getSongs } from "@/sdk";

interface SongRow {
  id: string;
  position: number;
  title?: string;
  artist?: string | null;
}

export default function PlayPage() {
  const { boxId } = useParams<{ boxId: string }>();
  const [rows, setRows] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState("📋 Copy");

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

  useEffect(() => {
    if (!boxId) return;
    setLoading(true);
    (async () => {
      try {
        const [boxSongs, songs] = await Promise.all([
          getBoxSongs(),
          getSongs(),
        ]);
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
        console.error("Error loading box data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [boxId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-5 w-full bg-background/40">
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
                    <TableHead>Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.artist}</TableCell>
                      <TableCell>{row.position}</TableCell>
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
