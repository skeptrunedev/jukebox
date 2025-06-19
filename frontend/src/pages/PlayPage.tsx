import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getBox, updateBox, getBoxSongs, getSongs } from "@/sdk";

interface SongRow {
  id: string;
  position: number;
  title?: string;
  artist?: string | null;
}

export default function PlayPage() {
  const { boxId } = useParams<{ boxId: string }>();
  const [boxName, setBoxName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
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
        console.error("Error loading box data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [boxId]);

  const handleSave = async () => {
    if (!boxId) return;
    setIsUpdating(true);
    try {
      await updateBox(boxId, { name: boxName });
    } catch (error) {
      console.error("Error updating box name:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center space-x-2">
        <Input
          value={boxName}
          onChange={(e) => setBoxName(e.currentTarget.value)}
        />
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Name"}
        </Button>
        <Button asChild variant="neutral">
          <a href={`/share/${boxId}`}>Share Box</a>
        </Button>
      </div>

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
  );
}
