export interface Database {
  boxes: {
    id: string;
    name: string;
    slug: string;
    user_id: string;
  };
  songs: {
    id: string;
    title: string;
    artist: string | null;
    youtube_id: string | null;
    youtube_url: string | null;
    duration: number | null;
    thumbnail_url: string | null;
  };
  box_songs: {
    id: string;
    box_id: string;
    song_id: string;
    user_id: string;
    position: number;
    status: "queued" | "playing" | "played";
  };
  users: {
    id: string;
    fingerprint: string;
    username: string;
  };
  song_youtube_status: {
    id: string;
    youtube_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    retry_count: number;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  };
  box_playback_state: {
    id: string;
    box_id: string;
    current_song_id: string | null;
    leader_user_id: string | null;
    is_playing: boolean;
    playback_position: number;
    position_updated_at: Date;
    created_at: Date;
    updated_at: Date;
  };
}
