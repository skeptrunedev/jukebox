import type { components } from "@/sdk/api";
import { useMemo } from "react";

/**
 * A row returned from the box-songs API, with metadata for playlist and player.
 */
export interface SongRow {
  id: string;
  position: number;
  title?: string | null;
  artist?: string | null;
  youtube_id?: string | null;
  youtube_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  status?: "queued" | "playing" | "played";
  user: components["schemas"]["User"];
}

/**
 * A normalized song object for the YouTube player.
 */
export interface PlayerSong {
  id: string;
  title?: string;
  artist?: string;
  youtube_id?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  duration?: number;
  status?: "queued" | "playing" | "played";
}

/**
 * Convert an array of SongRow entries into PlayerSong entries.
 */
export function toPlayerSongs(rows: SongRow[]): PlayerSong[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title || undefined,
    artist: row.artist || undefined,
    youtube_id: row.youtube_id || undefined,
    youtube_url: row.youtube_url || undefined,
    thumbnail_url: row.thumbnail_url || undefined,
    duration: row.duration || undefined,
    status: row.status,
  }));
}

/**
 * Memoize conversion of SongRow array to PlayerSong array.
 */
export function usePlayerSongs(rows: SongRow[]): PlayerSong[] {
  return useMemo(() => toPlayerSongs(rows), [rows]);
}
