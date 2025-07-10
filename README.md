
<div align="right">
  <details>
    <summary >🌐 Language</summary>
    <div>
      <div align="right">
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=en">English</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=zh-CN">简体中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=zh-TW">繁體中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=ja">日本語</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=ko">한국어</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=hi">हिन्दी</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=th">ไทย</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=fr">Français</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=de">Deutsch</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=es">Español</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=it">Itapano</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=ru">Русский</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=pt">Português</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=nl">Nederlands</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=pl">Polski</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=ar">العربية</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=fa">فارسی</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=tr">Türkçe</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=vi">Tiếng Việt</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=skeptrunedev&project=jukebox&lang=id">Bahasa Indonesia</a></p>
      </div>
    </div>
  </details>
</div>

<p align="center">
  <a href="https://www.jukeboxhq.com">
    <img height="500" src="frontend/public/opengraph-image.jpg" alt="Trieve Logo">
  </a>
</p>

<p align="center">
  <a href="https://hub.docker.com/r/skeptrune/jukebox-server" style="text-decoration: none;">
    <img src="https://img.shields.io/docker/pulls/skeptrune/jukebox-server?style=flat-square" alt="Docker Pulls" />
  </a>
  <a href="https://github.com/skeptrunedev/jukebox/stargazers" style="text-decoration: none;">
    <img src="https://img.shields.io/github/stars/skeptrunedev/jukebox?style=flat-square" alt="GitHub stars" />
  </a>
  <a href="https://x.com/skeptrune" style="text-decoration: none;">
    <img src="https://img.shields.io/badge/follow%20on-x.com-1da1f2?logo=x&style=flat-square" alt="Follow on X (Twitter)" />
  </a>
</p>

---

# Turn Any Device Into a Collaborative Jukebox

**Jukebox** lets you instantly create a shared music playlist with friends—no app, no login, no ads. Just create a box, share a link, and start adding songs together. Perfect for parties, road trips, or any group hangout!

- 🌐 **Open Source Alternative to Spotify Collaborative Playlists**
- 🕵️ **No Account Needed**: Use anonymously—no sign up or email required
- ✨ **Share a Link, Add Songs Together**: Everyone can contribute in real time
- 🚀 **No App Download Required**: Works on any device, right in your browser
- 🎵 **YouTube Integration**: Search and play almost any song instantly
- 📱 **Mobile Friendly**: Designed for phones, tablets, and desktops
- ⚖️ **Fair Queueing**: Songs are auto-sorted so everyone gets a turn
- 🆓 **100% Free, No Ads**

---

## Try It Now

1. **Create a Jukebox**: Visit the homepage and create a new box
2. **Share the Link**: Send the invite link to your friends
3. **Add Songs**: Search YouTube or add songs manually
4. **Play Music**: Use the built-in player to stream together

---

## Features

- Collaborative playlists: Add, queue, and play songs together
- Anonymous usage: No login or account required
- YouTube search & playback: Access a huge music library
- Mobile-first, responsive UI
- Open source (MIT License)
- Easy deployment with Docker

### Docker Compose Deployments

Spin up all services:

```bash
docker-compose up -d
```

Redeploy services with zero downtime after updating images:

```bash
bash ./redeploy.sh
```

---

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

```bash
# Clone the repository
git clone <your-repo-url>
cd jukebox

# Install server dependencies
cd server
yarn install

# Install frontend dependencies
cd ../frontend
yarn install

# Configure environment variables
cd ../server
cp .env.example .env
# Edit .env and add your YouTube API key

# Run database migrations
yarn migrate

# Start the development servers
# Backend:
cd server
yarn dev
# Worker:
cd server
yarn dev:worker
# Frontend (in a new terminal):
cd frontend
yarn dev
```

---

## License

MIT

---

## Contributing & Feedback

- Open an issue or pull request on [GitHub](https://github.com/skeptrunedev/jukebox)
- Feature requests? DM [@skeptrune on X (Twitter)](https://twitter.com/skeptrune)

---

## Changelog

See the [Changelog](https://jukebox.skeptrune.com#changelog) for the latest updates and features.
