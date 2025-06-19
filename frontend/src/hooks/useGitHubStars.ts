import { useState, useEffect } from 'react';

export function useGitHubStars(repo: string) {
  const [stars, setStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repository data: ${response.status}`);
        }
        
        const data = await response.json();
        setStars(data.stargazers_count);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stars');
        setStars(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, [repo]);

  const formatStars = (count: number): string => {
    if (count >= 1000) {
      return (Math.round(count / 100) / 10).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return {
    stars,
    formattedStars: stars !== null ? formatStars(stars) : null,
    loading,
    error
  };
}
