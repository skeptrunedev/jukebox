import React, { useState, useCallback, useEffect, useRef } from "react";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { useEventSource } from "@/hooks/useEventSource";
import type { PlaybackState } from "@/lib/player";
import { SyncContext, type SyncContextValue } from "./syncContext";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { box, user } = useJukebox();
  const [isListeningAlong, setIsListeningAlong] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const lastSyncRef = useRef<number>(0);

  // Fetch initial playback state
  const fetchPlaybackState = useCallback(async () => {
    if (!box?.id) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_HOST || ""}/api/boxes/${box.id}/playback-state`
      );
      const state = await response.json();
      setPlaybackState(state);
      setIsLeader(state.leader_user_id === user?.id);
    } catch (error) {
      console.error("Failed to fetch playback state:", error);
    }
  }, [box?.id, user?.id]);

  useEffect(() => {
    fetchPlaybackState();
  }, [fetchPlaybackState]);

  // Listen for playback state changes via SSE
  const sseUrl = box?.id && isListeningAlong 
    ? `${import.meta.env.VITE_API_HOST || ""}/api/boxes/${box.id}/events` 
    : null;
    
  useEventSource(sseUrl, {
    onMessage: (event) => {
      const data = event.data;
      if (data.type === "playback_state_changed") {
        setPlaybackState(data.state);
        setIsLeader(data.state.leader_user_id === user?.id);
        lastSyncRef.current = Date.now();
      } else if (data.type === "leader_released") {
        setIsLeader(false);
        setPlaybackState((prev) => prev ? { ...prev, leader_user_id: null } : null);
      }
    }
  });

  const startListeningAlong = useCallback(async () => {
    if (!box?.id || !user?.id) return;
    
    setIsListeningAlong(true);
    await fetchPlaybackState();
  }, [box?.id, user?.id, fetchPlaybackState]);

  const stopListeningAlong = useCallback(async () => {
    if (!box?.id || !user?.id || !isLeader) {
      setIsListeningAlong(false);
      return;
    }
    
    // Release leadership if we're the leader
    try {
      await fetch(
        `${import.meta.env.VITE_API_HOST || ""}/api/boxes/${box.id}/playback-state/leader`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id })
        }
      );
    } catch (error) {
      console.error("Failed to release leadership:", error);
    }
    
    setIsListeningAlong(false);
    setIsLeader(false);
  }, [box?.id, user?.id, isLeader]);

  const updatePlaybackState = useCallback(async (updates: Partial<PlaybackState>) => {
    if (!box?.id || !user?.id || !isListeningAlong) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_HOST || ""}/api/boxes/${box.id}/playback-state`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updates,
            user_id: user.id
          })
        }
      );
      
      if (response.ok) {
        setIsLeader(true);
      }
    } catch (error) {
      console.error("Failed to update playback state:", error);
    }
  }, [box?.id, user?.id, isListeningAlong]);

  const syncToLeader = useCallback(() => {
    // This will be called by YouTubePlayer to sync position
    lastSyncRef.current = Date.now();
  }, []);

  const value: SyncContextValue = {
    isListeningAlong,
    isLeader,
    playbackState,
    startListeningAlong,
    stopListeningAlong,
    updatePlaybackState,
    syncToLeader
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}