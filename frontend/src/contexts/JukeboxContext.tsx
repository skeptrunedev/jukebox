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
  getSongsByIds,
  createSong,
  createBoxSong,
  updateBoxSong,
  getYouTubeAudioUrl,
  getUser,
  createUser,
  updateUser as updateUserSDK,
} from "@/sdk";
import { usePlayerSongs, type SongRow, type PlayerSong } from "@/lib/player";
import { JukeboxContext } from "@/hooks/useJukeboxContext";
import fingerprintjs from "@fingerprintjs/fingerprintjs";
import { usernames } from "@/assets/cool-names";

type Box = components["schemas"]["Box"];
type User = components["schemas"]["User"];

export interface JukeboxContextValue {
  box?: Box;
  rows: SongRow[];
  setRows: Dispatch<SetStateAction<SongRow[]>>;
  songs: PlayerSong[];
  loading: boolean;
  slug?: string;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
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
  updateUser: (data: {
    username?: string;
    fingerprint?: string;
  }) => Promise<void>;
  currentSongIndex: number;
  mediaMap: Record<string, string>;
  /** Get pre-cached audio URL for a YouTube video ID */
  getMediaUrl: (youtubeId: string) => string | undefined;
  setCurrentSongIndex: Dispatch<SetStateAction<number>>;
  /** Go to the previous song in the playlist */
  goToPrevious: () => void;
  /** Go to the next song in the playlist */
  goToNext: () => void;
  /** Check if there is a previous song available */
  hasPrevious: boolean;
  /** Check if there is a next song available */
  hasNext: boolean;
  user?: User;
}

// Helper function to check if two SongRow arrays are equal
const areSongRowsEqual = (prev: SongRow[], next: SongRow[]): boolean => {
  if (prev.length !== next.length) return false;

  return prev.every((prevRow, index) => {
    const nextRow = next[index];
    if (!nextRow) return false;

    return (
      prevRow.id === nextRow.id &&
      prevRow.position === nextRow.position &&
      prevRow.title === nextRow.title &&
      prevRow.artist === nextRow.artist &&
      prevRow.youtube_id === nextRow.youtube_id &&
      prevRow.youtube_url === nextRow.youtube_url &&
      prevRow.thumbnail_url === nextRow.thumbnail_url &&
      prevRow.duration === nextRow.duration &&
      prevRow.status === nextRow.status
    );
  });
};

export function JukeboxProvider({ children }: { children: ReactNode }) {
  const { boxSlug } = useParams<{ boxSlug: string }>();
  const [box, setBox] = useState<Box | undefined>(undefined);
  const [rows, setRows] = useState<SongRow[]>([]);
  const songs = usePlayerSongs(rows);
  const [loading, setLoading] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [fingerprint, setFingerprint] = useState<string | undefined>();
  const [user, setUser] = useState<User | undefined>();

  // Media cache: YouTube videoId -> audio URL
  const [mediaMap, setMediaMap] = useState<Record<string, string>>(() => {
    try {
      const data = localStorage.getItem("jukebox-media-cache");
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  });

  /** Prefetch and cache audio URLs for given YouTube IDs */
  const prefetchMedia = useCallback((ids: string[]) => {
    ids.forEach((id) => {
      setMediaMap((prev) => {
        if (prev[id]) return prev;
        const url = getYouTubeAudioUrl(id);
        const updated = { ...prev, [id]: url };
        try {
          localStorage.setItem("jukebox-media-cache", JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    });
  }, []);

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

  const fetchBoxSongs = useCallback(async () => {
    if (!boxSlug) return;
    setLoading(true);
    try {
      const limit = 20; // You can make this configurable
      const offset = page * limit;
      const response = await getBoxSongs({ limit, offset });

      if (!response.data || response.data.length === 0) {
        setRows((prevRows) => {
          // Only clear if we actually had rows before
          return prevRows.length > 0 ? [] : prevRows;
        });
        return;
      }

      // Get all unique song IDs from the box songs
      const songIds = response.data
        .map((boxSong) => boxSong.song_id)
        .filter((id): id is string => Boolean(id));

      // Fetch song details for these IDs
      const songs = await getSongsByIds(songIds);
      const songMap = new Map(songs.map((song) => [song.id, song]));

      const userIds = response.data
        .map((boxSong) => boxSong.user_id)
        .filter((id): id is string => Boolean(id));

      const users = await Promise.all(
        userIds.map((id) => getUser(id).catch(() => undefined))
      );
      const userMap = new Map(users.map((user) => [user?.id || "", user]));

      // Convert box songs to SongRow format
      const newSongRows: SongRow[] = response.data
        .map((boxSong) => {
          const song = songMap.get(boxSong.song_id || "");
          const user = userMap.get(boxSong.user_id || "");
          if (!song) return null;

          return {
            id: boxSong.id || "",
            position: boxSong.position ?? 0,
            title: song.title || "",
            artist: song.artist || "",
            youtube_id: song.youtube_id || "",
            youtube_url: song.youtube_url || "",
            thumbnail_url: song.thumbnail_url || "",
            duration: song.duration || 0,
            status: boxSong.status ?? "queued",
            user,
          };
        })
        .filter(
          (row): row is NonNullable<typeof row> => row !== null
        ) as SongRow[]; // Only update state if the data has actually changed
      setRows((prevRows) => {
        // Use helper function for deep comparison
        return areSongRowsEqual(prevRows, newSongRows) ? prevRows : newSongRows;
      });
    } catch (error) {
      console.error("Error loading box songs:", error);
      setRows((prevRows) => {
        // Only clear on error if we had rows before
        return prevRows.length > 0 ? [] : prevRows;
      });
    } finally {
      setLoading(false);
    }
  }, [boxSlug, page]);

  useEffect(() => {
    const storedFingerprint = localStorage.getItem("jukebox-fingerprint");
    if (storedFingerprint) {
      setFingerprint(storedFingerprint);
    } else {
      fingerprintjs.load().then((fp) => {
        fp.get().then((result) => {
          const fingerprintValue = result.visitorId;
          setFingerprint(fingerprintValue);
          localStorage.setItem("jukebox-fingerprint", fingerprintValue);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!fingerprint) return;

    const fetchOrCreateUser = async () => {
      try {
        const existingUser = await getUser(fingerprint);
        setUser(existingUser);
      } catch (error) {
        // If user not found, create a new one
        if (error instanceof Error && error.message.includes("404")) {
          try {
            const randomUsername =
              usernames[Math.floor(Math.random() * usernames.length)];
            if (!randomUsername) {
              console.error("Could not get a random username");
              return;
            }
            const newUser = await createUser({
              fingerprint,
              username: randomUsername,
            });
            setUser(newUser);
          } catch (createError) {
            console.error("Error creating user:", createError);
          }
        } else {
          console.error("Error fetching user:", error);
        }
      }
    };

    fetchOrCreateUser();
  }, [fingerprint]);

  useEffect(() => {
    fetchBox();
  }, [fetchBox]);

  useEffect(() => {
    fetchBoxSongs();

    const refetchInterval = setInterval(() => {
      fetchBoxSongs();
    }, 2000);

    return () => clearInterval(refetchInterval);
  }, [fetchBoxSongs]);

  // Prefetch media whenever the songs list changes
  useEffect(() => {
    const youtubeIds = songs
      .map((song) => song.youtube_id)
      .filter((youtube_id): youtube_id is string => Boolean(youtube_id));

    if (youtubeIds.length > 0) {
      prefetchMedia(youtubeIds);
    }
  }, [songs, prefetchMedia]);

  const addSong = useCallback(
    async (songData: {
      title: string;
      artist: string;
      youtube_id: string;
      youtube_url: string;
      thumbnail_url: string;
      duration: number;
    }) => {
      if (!boxSlug || !user?.id) return;
      try {
        const song = await createSong(songData);
        const relation = await createBoxSong({
          box_id: boxSlug,
          song_id: song.id || "",
          user_id: user.id,
          position: rows.length,
          status: "queued",
        });

        const newRow: SongRow = {
          id: relation.id || "",
          position: relation.position ?? 0,
          title: song.title,
          artist: song.artist,
          youtube_id: song.youtube_id,
          youtube_url: song.youtube_url,
          thumbnail_url: song.thumbnail_url,
          duration: song.duration,
          status: relation.status ?? "queued",
          user,
        };

        setRows((prev) => {
          // Check if this song already exists to avoid duplicates
          const existingSong = prev.find((row) => row.id === newRow.id);
          if (existingSong) {
            return prev; // Don't add duplicate
          }
          return [...prev, newRow];
        });
      } catch (error) {
        console.error("Error adding YouTube song:", error);
        throw error;
      }
    },
    [boxSlug, rows.length, user]
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

  const updateUser = useCallback(
    async (data: { username?: string; fingerprint?: string }) => {
      if (!user?.id) {
        console.error("No user to update");
        return;
      }
      try {
        const updatedUser = await updateUserSDK(user.id, data);
        setUser(updatedUser);
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },
    [user]
  );

  // Navigation functions for previous/next songs
  const goToPrevious = useCallback(() => {
    setCurrentSongIndex((prevIndex) => {
      const newIndex = prevIndex - 1;
      return newIndex >= 0 ? newIndex : prevIndex;
    });
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSongIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      return newIndex < songs.length ? newIndex : prevIndex;
    });
  }, [songs.length]);

  // Helper properties to check if navigation is available
  const hasPrevious = currentSongIndex > 0;
  const hasNext = currentSongIndex < songs.length - 1;

  // Expose context value
  return (
    <JukeboxContext.Provider
      value={{
        box,
        rows,
        setRows,
        songs,
        loading,
        slug: boxSlug,
        page,
        setPage,
        addSong,
        updateStatus,
        mediaMap,
        getMediaUrl: (id) => mediaMap[id],
        currentSongIndex,
        setCurrentSongIndex,
        goToPrevious,
        goToNext,
        hasPrevious,
        hasNext,
        user,
        updateUser,
      }}
    >
      {children}
    </JukeboxContext.Provider>
  );
}
