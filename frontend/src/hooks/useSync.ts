import { useContext } from "react";
import { SyncContext, type SyncContextValue } from "@/contexts/syncContext";

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}