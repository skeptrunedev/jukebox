import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Plus } from "lucide-react";
import {
  parseYouTubeDuration,
  formatDuration,
  cleanYouTubeTitle,
} from "@/lib/youtube";
import { searchYouTube } from "@/sdk";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { motion, AnimatePresence } from "framer-motion";

interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  url: string;
}

interface SongSearchProps {
  onSongSelect: (song: {
    title: string;
    artist: string;
    youtube_id: string;
    youtube_url: string;
    thumbnail_url: string;
    duration: number;
  }) => void;
}

export default function SongSearch({ onSongSelect }: SongSearchProps) {
  const { songs, rows } = useJukebox();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const data = await searchYouTube(searchQuery, 10);
      // Map the SDK response to our expected format, filtering out any incomplete results
      const validResults: YouTubeSearchResult[] = (data.items || []).filter(
        (item): item is Required<NonNullable<typeof item>> =>
          !!(
            item?.id &&
            item?.title &&
            item?.channelTitle &&
            item?.thumbnail &&
            item?.duration &&
            item?.url
          )
      );
      setResults(validResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsSearching(true);

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for search
    debounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 1500);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSongSelect = async (result: YouTubeSearchResult) => {
    // Set loading state for this specific song
    setAddingIds((prev) => new Set(prev).add(result.id));

    try {
      // Clean up the title to extract artist and song name
      const { cleanTitle, possibleArtist } = cleanYouTubeTitle(result.title);
      const channelTitle = result.channelTitle
        .replace(/\s*(VEVO|Records|Music|Official)\s*/gi, "")
        .trim();

      onSongSelect({
        title: cleanTitle,
        artist: possibleArtist || channelTitle,
        youtube_id: result.id,
        youtube_url: result.url,
        thumbnail_url: result.thumbnail,
        duration: parseYouTubeDuration(result.duration),
      });
    } finally {
      // Remove loading state for this song
      setAddingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(result.id);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="song-search"
            placeholder="Search for songs on YouTube..."
            value={query}
            onChange={handleInputChange}
          />
        </div>
        {isSearching && (
          <div className="flex items-center px-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="text-red-600 text-sm p-2 bg-red-50 rounded-md"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <h3 className="font-semibold text-lg">Search Results</h3>
            <div className="grid gap-3 max-h-96 overflow-y-auto scrollbar">
              <AnimatePresence>
                {results
                  .filter(
                    (result) =>
                      !(
                        songs.some((song) => song.youtube_id === result.id) ||
                        rows.some((row) => row.youtube_id === result.id) ||
                        addingIds.has(result.id)
                      )
                  )
                  .map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Card className="p-0">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={result.thumbnail}
                                alt={result.title}
                                className="w-16 h-12 object-cover rounded"
                              />
                              <div className="min-w-0">
                                <h4
                                  className="font-medium text-sm text-wrap"
                                  title={result.title}
                                  dangerouslySetInnerHTML={{
                                    __html: result.title,
                                  }}
                                />
                                <p
                                  className="text-xs text-gray-600 text-wrap"
                                  title={result.channelTitle}
                                  dangerouslySetInnerHTML={{
                                    __html: result.channelTitle,
                                  }}
                                />
                                <p className="text-xs text-gray-500">
                                  {formatDuration(
                                    parseYouTubeDuration(result.duration)
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSongSelect(result)}
                              disabled={addingIds.has(result.id)}
                              className="flex items-center gap-1"
                            >
                              {addingIds.has(result.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              {addingIds.has(result.id) ? "Adding..." : "Add"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
