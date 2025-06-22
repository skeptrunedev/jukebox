import { type JukeboxContextValue } from "@/contexts/JukeboxContext";
import { createContext, useContext } from "react";

export const JukeboxContext = createContext<JukeboxContextValue | undefined>(
  undefined
);

export const useJukebox = (): JukeboxContextValue => {
  const context = useContext(JukeboxContext);
  if (!context) {
    throw new Error("useJukebox must be used within JukeboxProvider");
  }
  return context;
};
