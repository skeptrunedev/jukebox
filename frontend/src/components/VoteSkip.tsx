import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SkipForward, Users } from "lucide-react";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { useSync } from "@/hooks/useSync";
import { useEventSource } from "@/hooks/useEventSource";

interface VoteSkipProps {
  songId: string;
}

interface Vote {
  user_id: string;
  created_at: string;
}

interface VotesResponse {
  votes: Vote[];
  vote_count: number;
  threshold: number;
}

export function VoteSkip({ songId }: VoteSkipProps) {
  const { box, user } = useJukebox();
  const { isListeningAlong } = useSync();
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [threshold, setThreshold] = useState(1);
  const [isVoting, setIsVoting] = useState(false);

  // Reset vote state when song changes
  useEffect(() => {
    setHasVoted(false);
    
    const fetchVotes = async () => {
      if (!box?.id) return;
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_HOST || ""}/api/boxes/${box.id}/songs/${songId}/votes`
        );
        const data: VotesResponse = await response.json();
        setVoteCount(data.vote_count);
        setThreshold(data.threshold);
        setHasVoted(data.votes.some((v) => v.user_id === user?.id));
      } catch (error) {
        console.error("Failed to fetch votes:", error);
      }
    };
    
    fetchVotes();
  }, [songId, box?.id, user?.id]);

  // Listen for vote updates via SSE
  const sseUrl = box?.id && isListeningAlong
    ? `${import.meta.env.VITE_API_HOST || ""}/api/boxes/${box.id}/events`
    : null;
    
  useEventSource(sseUrl, {
    onMessage: (event) => {
      const data = event.data;
      if (data.type === "skip_vote_update" && data.song_id === songId) {
        setVoteCount(data.vote_count);
        setThreshold(data.threshold);
        if (data.voter_id === user?.id) {
          setHasVoted(true);
        }
      }
    }
  });

  const handleVote = async () => {
    if (!box?.id || !user?.id || hasVoted) return;
    
    setIsVoting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_HOST || ""}/api/boxes/${box.id}/vote-skip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            song_id: songId
          })
        }
      );
      
      if (response.ok) {
        setHasVoted(true);
        const data = await response.json();
        setVoteCount(data.vote_count);
        setThreshold(data.threshold);
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  if (!isListeningAlong) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={hasVoted ? "default" : "neutral"}
        size="sm"
        onClick={handleVote}
        disabled={hasVoted || isVoting}
      >
        <SkipForward className="h-4 w-4 mr-1" />
        {hasVoted ? "Voted" : "Vote Skip"}
      </Button>
      <span className="text-sm text-muted-foreground">
        <Users className="h-3 w-3 inline mr-1" />
        {voteCount}/{threshold}
      </span>
    </div>
  );
}