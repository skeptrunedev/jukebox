/**
 * Utility functions for YouTube integration
 */

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert YouTube duration (PT4M13S) to seconds
 */
export function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Clean up YouTube video title for better song/artist extraction
 */
export function cleanYouTubeTitle(title: string): {
  cleanTitle: string;
  possibleArtist: string;
} {
  // Remove common patterns
  const cleanTitle = title
    .replace(/\s*\(.*?Official.*?\)\s*/gi, "")
    .replace(/\s*\[.*?Official.*?\]\s*/gi, "")
    .replace(/\s*\(.*?Video.*?\)\s*/gi, "")
    .replace(/\s*\[.*?Video.*?\]\s*/gi, "")
    .replace(/\s*\(.*?Audio.*?\)\s*/gi, "")
    .replace(/\s*\[.*?Audio.*?\]\s*/gi, "")
    .replace(/\s*HD\s*/gi, "")
    .replace(/\s*4K\s*/gi, "")
    .trim();

  // Extract artist from patterns like "Artist - Song" or "Artist: Song"
  const artistSongPatterns = [
    /^(.+?)\s*[-–—]\s*(.+)$/,
    /^(.+?)\s*:\s*(.+)$/,
    /^(.+?)\s*\|\s*(.+)$/,
  ];

  for (const pattern of artistSongPatterns) {
    const match = cleanTitle.match(pattern);
    if (match) {
      return {
        cleanTitle: match[2].trim(),
        possibleArtist: match[1].trim(),
      };
    }
  }

  return {
    cleanTitle,
    possibleArtist: "",
  };
}
