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
  updateUser: (data: {
    username?: string;
    fingerprint?: string;
  }) => Promise<void>;
  currentSongIndex: number;
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

export function JukeboxProvider({ children }: { children: ReactNode }) {
  const { boxSlug } = useParams<{ boxSlug: string }>();
  const [box, setBox] = useState<Box | undefined>(undefined);
  const [rows, setRows] = useState<SongRow[]>([]);
  const songs = usePlayerSongs(rows);
  const [loading, setLoading] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [page, setPage] = useState(0);
  const [fingerprint, setFingerprint] = useState<string | undefined>();
  const [user, setUser] = useState<User | undefined>();

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
      const response = await getBoxSongs(box?.id ?? "", { limit, offset });

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
        ) as SongRow[];
      setRows((prevRows) => {
        return newSongRows.map((newRow, idx) => {
          const prevRow = prevRows[idx];
          if (
            prevRow &&
            prevRow.id === newRow.id &&
            prevRow.position === newRow.position &&
            prevRow.title === newRow.title &&
            prevRow.artist === newRow.artist &&
            prevRow.youtube_id === newRow.youtube_id &&
            prevRow.youtube_url === newRow.youtube_url &&
            prevRow.thumbnail_url === newRow.thumbnail_url &&
            prevRow.duration === newRow.duration &&
            prevRow.status === newRow.status
          ) {
            return prevRow; // keep reference if unchanged
          }
          return newRow;
        });
      });

      // set the current song index to the first playing song or the first queued song
      let playingIndex = newSongRows.findIndex(
        (row) => row.status === "playing" || row.status === "queued"
      );
      if (newSongRows.length && playingIndex === -1) {
        playingIndex = 0;
      }
      if (playingIndex !== undefined && playingIndex !== -1) {
        setCurrentSongIndex((prevIndex) =>
          prevIndex === -1 && prevIndex !== playingIndex
            ? playingIndex
            : prevIndex
        );
      }
    } catch (error) {
      console.error("Error loading box songs:", error);
      setRows((prevRows) => {
        // Only clear on error if we had rows before
        return prevRows.length > 0 ? [] : prevRows;
      });
    } finally {
      setLoading(false);
    }
  }, [box?.id, boxSlug, page]);

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
      // Optimistically add a temporary SongRow immediately
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticRow: SongRow = {
        id: tempId,
        position: 9999,
        title: songData.title,
        artist: songData.artist,
        youtube_id: songData.youtube_id,
        youtube_url: songData.youtube_url,
        thumbnail_url: songData.thumbnail_url,
        duration: songData.duration,
        status: "queued",
        user,
      };
      setRows((prev) => {
        if (prev.some((row) => row.youtube_id === songData.youtube_id)) {
          return prev;
        }
        return [...prev, optimisticRow];
      });
      try {
        let song;
        try {
          const foundSongs = await getSongsByIds([songData.youtube_id]);
          if (foundSongs && foundSongs.length > 0) {
            song = foundSongs[0];
          } else {
            song = await createSong(songData);
          }
        } catch {
          song = await createSong(songData);
        }
        const relation = await createBoxSong({
          box_id: boxSlug,
          song_id: song.id || "",
          user_id: user.id,
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
          // Remove the optimistic row and add the real one (unless already present)
          const filtered = prev.filter(
            (row) => row.id !== tempId && row.youtube_id !== newRow.youtube_id
          );
          // Avoid duplicate if already present (e.g. from polling)
          if (filtered.some((row) => row.id === newRow.id)) {
            return filtered;
          }
          return [...filtered, newRow];
        });
      } catch (error) {
        // Remove the optimistic row on error
        setRows((prev) => prev.filter((row) => row.id !== tempId));
        console.error("Error adding YouTube song:", error);
        throw error;
      }
    },
    [boxSlug, user]
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
    const currentSong = songs[currentSongIndex];
    if (currentSong) {
      try {
        updateBoxSong(currentSong.id, {
          status: "played",
        });
      } catch (error) {
        console.error("Failed to update song status to played:", error);
      }
    }
    setCurrentSongIndex((prevIndex) => {
      const newIndex = prevIndex - 1;
      return newIndex >= 0 ? newIndex : prevIndex;
    });
  }, [songs, currentSongIndex]);

  const goToNext = useCallback(() => {
    const currentSong = songs[currentSongIndex];
    if (currentSong) {
      try {
        updateBoxSong(currentSong.id, {
          status: "played",
        });
      } catch (error) {
        console.error("Failed to update song status to played:", error);
      }
    }
    setCurrentSongIndex((prevIndex) => {
      const newIndex = prevIndex + 1;
      return newIndex < songs.length ? newIndex : prevIndex;
    });
  }, [currentSongIndex, songs]);

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
