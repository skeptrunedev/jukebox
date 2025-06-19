export interface Database {
  boxes: {
    id: string;
    name: string;
  };
  songs: {
    id: string;
    title: string;
    artist: string | null;
  };
  box_songs: {
    id: string;
    box_id: string;
    song_id: string;
    position: number;
  };
}