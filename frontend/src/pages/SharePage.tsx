import { Card, CardContent } from "@/components/ui/card";
import SongSearch from "@/components/SongSearch";
import { SongTable } from "@/components/SongTable";
import { Check, Clock, Play } from "lucide-react";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { motion } from "framer-motion";

export default function SharePage() {
  const { rows, addSong } = useJukebox();

  return (
    <div className="flex flex-1 items-center justify-center p-5 w-full bg-background/40">
      <div className="mx-auto w-[1300px] max-w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Add Songs to the Jukebox</h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="bg-white text-foreground">
            <CardContent>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Add Songs</h3>
                <p className="text-sm text-muted-foreground">
                  Search for songs on YouTube to add to this jukebox
                </p>
                <SongSearch onSongSelect={addSong} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
        >
          <Card className="bg-white text-foreground">
            <CardContent>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Current Playlist</h3>
                <p className="text-sm text-muted-foreground">
                  Songs currently in this jukebox playlist
                </p>
                <SongTable
                  rows={rows}
                  columns={[
                    { header: "#", cell: (r) => r.position },
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
                      header: "Added By",
                      cell: (r) => r.user.username || "Unknown",
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
                  ]}
                  getRowProps={(r) => ({ key: r.id })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
