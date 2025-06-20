# Jukebox

A collaborative music jukebox app where users can add songs to shared playlists and play them via YouTube integration.

## Features

- 🎵 **YouTube Integration**: Search and add songs directly from YouTube
- 📱 **Collaborative Playlists**: Multiple users can add songs to shared jukeboxes
- 🎮 **Built-in Player**: Stream music via embedded YouTube player
- 🔍 **Smart Search**: Search YouTube's vast music library
- 📊 **Playlist Management**: Organize and manage your music collections

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- YouTube Data API v3 key (free from Google)

### YouTube API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy your API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd jukebox
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure environment variables:
```bash
cd ../server
cp .env.example .env
# Edit .env and add your YouTube API key
```

5. Run database migrations:
```bash
npm run migrate
```

6. Start the development servers:

Backend:
```bash
cd server
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

## Usage

1. **Create a Jukebox**: Visit the homepage and create a new jukebox
2. **Share the Link**: Copy the share link and send it to friends
3. **Add Songs**: Use the YouTube search to find and add songs, or add them manually
4. **Play Music**: Use the built-in player to stream songs via YouTube

## API Endpoints

- `GET /api/boxes` - List all jukeboxes
- `POST /api/boxes` - Create a new jukebox
- `GET /api/songs` - List all songs
- `POST /api/songs` - Add a song (with YouTube data)
- `GET /api/youtube/search` - Search YouTube for songs
- `GET /api/box_songs` - Get playlist relationships

## YouTube Integration

Songs added via YouTube search include:
- Video ID for embedded playback
- Thumbnail images
- Duration information
- Direct YouTube URLs

Songs can also be added manually without YouTube integration, but won't be playable in the built-in player.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite with Kysely query builder
- **APIs**: YouTube Data API v3
- **Player**: YouTube Embed API

## License

MIT

## Setup

Install dependencies for both services:

```bash
# Frontend
cd frontend
npm install

# Server
cd ../server
npm install
```

## Running in development

Start both services in separate terminals:

```bash
# Terminal 1 (frontend)
cd frontend
npm run dev

# Terminal 2 (server)
cd server
npm run dev
```

The React app will be available at http://localhost:5173 and the server at http://localhost:3001.

API requests from the frontend to `/api/*` will be proxied to the server.

## Building for production

```bash
# Frontend
cd frontend
npm run build

# Server
cd server
npm run build
npm start
```