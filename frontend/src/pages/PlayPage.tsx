import { useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractiveSongTable } from "@/components/InteractiveSongTable";
import type { Column } from "@/components/SongTable";
import YouTubePlayer from "@/components/YouTubePlayer";
import SongSearch from "@/components/SongSearch";
import { Copy, Check, X, Play, Clock } from "lucide-react";
import type { SongRow } from "@/lib/player";
import { useJukebox } from "@/hooks/useJukeboxContext";

export default function PlayPage() {
  const { rows, setRows, shareUrl, addSong, currentSongIndex } = useJukebox();
  const [copyButtonText, setCopyButtonText] = useState<ReactNode>(
    <>
      <Copy className="w-4 h-4 mr-1" />
      Copy
    </>
  );

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
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

  return (
    <div className="flex flex-1 items-center justify-center p-5 w-full bg-background/40">
      <div className="mx-auto w-[1300px] max-w-full space-y-6">
        <Card className="bg-white text-foreground">
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Share this Jukebox</h3>
              <p className="text-sm text-muted-foreground">
                Share this link so others can add songs to this jukebox
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  value={shareUrl || ""}
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

        <YouTubePlayer />

        <Card className="bg-white text-foreground">
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Add Songs</h3>
              <p className="text-sm text-muted-foreground">
                Search for songs on YouTube to add to your jukebox
              </p>
              <SongSearch onSongSelect={addSong} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white text-foreground">
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Playlist</h3>
              <InteractiveSongTable
                rows={rows}
                columns={columns}
                onOrderChange={setRows}
                getRowProps={(row, index) => ({
                  key: row.id,
                  className: currentSongIndex === index ? "bg-neutral-100" : "",
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const columns: Column<SongRow>[] = [
  { header: "#", cell: (r) => r.position },
  {
    header: "Title",
    cell: (r: SongRow) => (
      <div className="flex items-center gap-2">
        <span
          className="font-medium"
          dangerouslySetInnerHTML={{ __html: r.title ?? "Unknown Title" }}
        ></span>
      </div>
    ),
  },
  {
    header: "Artist",
    cell: (r: SongRow) => (
      <div className="flex items-center gap-2">
        <span
          className="text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: r.artist ?? "Unknown Artist" }}
        ></span>
      </div>
    ),
  },
  {
    header: "Duration",
    cell: (r: SongRow) =>
      new Date((r.duration ?? 0) * 1000).toISOString().slice(14, 19),
  },
  {
    header: "Status",
    cell: (r: SongRow) => (
      <div className="flex items-center gap-2">
        {r.status === "playing" && <Play className="w-4 h-4 text-green-500" />}
        {r.status === "queued" && <Clock className="w-4 h-4" />}
        {r.status === "played" && <Check className="w-4 h-4" />}
        <span className="capitalize">{r.status}</span>
      </div>
    ),
  },
];
