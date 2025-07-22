import { useEffect, useRef, useCallback } from "react";

interface UseEventSourceOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onOpen?: (event: Event) => void;
  enabled?: boolean;
}

export function useEventSource(
  url: string | null,
  options: UseEventSourceOptions = {}
) {
  const { onMessage, onError, onOpen, enabled = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!url || !enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = (event) => {
        console.log("SSE connection opened");
        reconnectAttemptsRef.current = 0;
        onOpen?.(event);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(new MessageEvent("message", { data }));
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = (event) => {
        console.error("SSE connection error:", event);
        onError?.(event);
        
        // Reconnect with exponential backoff
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      };
    } catch (error) {
      console.error("Failed to create EventSource:", error);
    }
  }, [url, enabled, onMessage, onError, onOpen]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return eventSourceRef.current;
}