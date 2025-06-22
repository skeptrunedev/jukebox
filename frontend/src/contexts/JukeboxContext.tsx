import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useParams } from "react-router-dom";
import type { components } from "@/sdk/api";
import {
  getBox,
  getBoxSongs,
  getSongs,
  createSong,
  createBoxSong,
  updateBoxSong,
} from "@/sdk";
import { usePlayerSongs, type SongRow, type PlayerSong } from "@/lib/player";
import { JukeboxContext } from "@/hooks/useJukeboxContext";

type Box = components["schemas"]["Box"];

export interface JukeboxContextValue {
  box?: Box;
  rows: SongRow[];
  songs: PlayerSong[];
  loading: boolean;
  slug?: string;
  shareUrl?: string;
  addSong: (songData: {
    title: string;
    artist: string;
    youtube_id: string;
    youtube_url: string;
    thumbnail_url: string;
    duration: number;
  }) => Promise<void>;
  updateStatus: (
    songId: string,
    status: "queued" | "playing" | "played"
  ) => Promise<void>;
  currentSongIndex: number;
  setCurrentSongIndex: Dispatch<SetStateAction<number>>;
}

export function JukeboxProvider({ children }: { children: ReactNode }) {
  const { boxSlug } = useParams<{ boxSlug: string }>();
  const [box, setBox] = useState<Box | undefined>(undefined);
  const [rows, setRows] = useState<SongRow[]>([]);
  const songs = usePlayerSongs(rows);
  const [loading, setLoading] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const shareUrl = boxSlug
    ? `${window.location.origin}/share/${boxSlug}`
    : undefined;

  const fetchBox = useCallback(async () => {
    if (!boxSlug) return;
    try {
      const fetched = await getBox(boxSlug);
      setBox(fetched);
    } catch (error) {
      console.error("Error loading box data:", error);
      setBox(undefined);
    }
  }, [boxSlug]);

  useEffect(() => {
    fetchBox();
  }, [fetchBox]);

  const fetchSongs = useCallback(
    async (isInitialLoad = false) => {
      if (!boxSlug || !box?.id) return;
      try {
        const [boxSongs, allSongs] = await Promise.all([
          getBoxSongs(),
          getSongs(),
        ]);
        const filtered = boxSongs
          .filter((bs) => bs.box_id === box.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const songMap = new Map(allSongs.map((s) => [s.id, s]));
        const newRows: SongRow[] = filtered.map((bs) => ({
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
          const kept = prevRows.filter((row) => newIds.has(row.id));
          const added = newRows.filter((row) => !existingIds.has(row.id));
          return [...kept, ...added];
        });

        if (isInitialLoad) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading box data:", error);
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    },
    [boxSlug, box]
  );

  useEffect(() => {
    setLoading(true);
    fetchSongs(true);
    const intervalId = setInterval(() => fetchSongs(false), 2000);
    return () => clearInterval(intervalId);
  }, [fetchSongs]);

  const addSong = useCallback(
    async (songData: {
      title: string;
      artist: string;
      youtube_id: string;
      youtube_url: string;
      thumbnail_url: string;
      duration: number;
    }) => {
      if (!boxSlug) return;
      try {
        const song = await createSong(songData);
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
        throw error;
      }
    },
    [boxSlug, rows.length]
  );

  const updateStatus = useCallback(
    async (songId: string, status: "queued" | "playing" | "played") => {
      try {
        await updateBoxSong(songId, { status });
        setRows((prevRows) =>
          prevRows.map((row) => (row.id === songId ? { ...row, status } : row))
        );
      } catch (error) {
        console.error("Error updating song status:", error);
      }
    },
    []
  );

  return (
    <JukeboxContext.Provider
      value={{
        box,
        rows,
        songs,
        loading,
        slug: boxSlug,
        shareUrl,
        addSong,
        updateStatus,
        currentSongIndex,
        setCurrentSongIndex,
      }}
    >
      {children}
    </JukeboxContext.Provider>
  );
}
