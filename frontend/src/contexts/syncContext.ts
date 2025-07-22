import { createContext } from "react";
import type { PlaybackState, SyncState } from "@/lib/player";

export interface SyncContextValue extends SyncState {
  startListeningAlong: () => Promise<void>;
  stopListeningAlong: () => Promise<void>;
  updatePlaybackState: (updates: Partial<PlaybackState>) => Promise<void>;
  syncToLeader: () => void;
}

export const SyncContext = createContext<SyncContextValue | null>(null);