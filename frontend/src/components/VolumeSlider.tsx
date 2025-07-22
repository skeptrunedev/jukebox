import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VolumeSliderProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function VolumeSlider({ audioRef }: VolumeSliderProps) {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  useEffect(() => {
    const savedVolume = localStorage.getItem("jukebox_volume");
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      if (audioRef.current) {
        audioRef.current.volume = vol;
      }
    }
  }, [audioRef]);

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    localStorage.setItem("jukebox_volume", newVolume.toString());
  };

  const toggleMute = () => {
    if (isMuted) {
      const newVolume = previousVolume || 0.5;
      setVolume(newVolume);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
      localStorage.setItem("jukebox_volume", newVolume.toString());
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
      localStorage.setItem("jukebox_volume", "0");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="neutral"
        size="icon"
        onClick={toggleMute}
        className="h-8 w-8"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      
      <div
        className="w-24 bg-gray-200 rounded-full h-2 cursor-pointer relative"
        onClick={handleVolumeChange}
      >
        <div
          className="bg-main h-2 rounded-full transition-all duration-100"
          style={{ width: `${volume * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-main rounded-full shadow-md"
          style={{ left: `${volume * 100}%`, marginLeft: "-6px" }}
        />
      </div>
    </div>
  );
}