import { useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SongTable, type Column } from "@/components/SongTable";
import YouTubePlayer from "@/components/YouTubePlayer";
import SongSearch from "@/components/SongSearch";
import { Copy, Check, X, Play, Clock } from "lucide-react";
import type { SongRow } from "@/lib/player";
import { useJukebox } from "@/hooks/useJukeboxContext";

export default function PlayPage() {
  const { rows, loading, shareUrl, addSong, currentSongIndex } = useJukebox();
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

  if (loading) {
    return <div>Loading...</div>;
  }

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
