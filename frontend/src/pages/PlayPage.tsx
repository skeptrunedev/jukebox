import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InteractiveSongTable } from "@/components/InteractiveSongTable";
import type { Column } from "@/components/SongTable";
import YouTubePlayer from "@/components/YouTubePlayer";
import SongSearch from "@/components/SongSearch";
import { Copy, Check, X, Play, Clock } from "lucide-react";
import type { SongRow } from "@/lib/player";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { motion } from "framer-motion";

export default function PlayPage() {
  const { box, rows, setRows, addSong, currentSongIndex } = useJukebox();
  const [copyButtonText, setCopyButtonText] = useState<ReactNode>(
    <>
      <Copy className="w-4 h-4 mr-1" />
      Copy
    </>
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/share/${box?.slug || ""}`);
  }, [box]);

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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="bg-white text-foreground">
            <CardContent>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Share this Jukebox</h3>
                <p className="text-sm text-muted-foreground">
                  Share this link so others can add songs to this jukebox
                </p>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full max-w-full">
                  <span
                    className="flex-1 font-mono text-sm bg-muted px-3 py-1.5 rounded select-all cursor-pointer border-border border-2 w-full sm:w-fit overflow-x-auto whitespace-nowrap"
                    title={shareUrl || ""}
                    onClick={() => {
                      if (shareUrl) navigator.clipboard.writeText(shareUrl);
                    }}
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {shareUrl}
                  </span>
                  <Button
                    onClick={handleCopyUrl}
                    variant="neutral"
                    size="sm"
                    className="w-full sm:w-24 text-left"
                  >
                    {copyButtonText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <YouTubePlayer />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
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
                    className:
                      currentSongIndex === index ? "bg-neutral-100" : "",
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
    header: "Added By",
    cell: (r) => r.user.username || "Unknown",
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
