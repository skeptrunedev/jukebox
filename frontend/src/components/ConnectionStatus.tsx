import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useSync } from "@/hooks/useSync";

export function ConnectionStatus() {
  const { isListeningAlong } = useSync();
  const [isConnected, setIsConnected] = useState(true);
  const [reconnectAttempts] = useState(0);

  useEffect(() => {
    if (!isListeningAlong) {
      setIsConnected(true);
      return;
    }

    // Monitor SSE connection status
    const checkConnection = () => {
      // Implementation depends on SSE state exposure
      // For now, assume connected
      setIsConnected(true);
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [isListeningAlong]);

  if (!isListeningAlong) return null;

  return (
    <div className="fixed bottom-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-2 rounded-full shadow-lg border border-border">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm">
            Reconnecting{reconnectAttempts > 0 && ` (${reconnectAttempts})`}...
          </span>
        </>
      )}
    </div>
  );
}