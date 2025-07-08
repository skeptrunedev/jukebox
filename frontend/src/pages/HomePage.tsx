import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { createBox } from "../sdk";
import { names } from "../assets/cool-names";
import { CreateBoxDialog } from "../components/CreateBoxDialog";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { Star, Sparkles } from "lucide-react";
import { SparkleText } from "../components/ui/SparkleText";
import Marquee from "../components/ui/marquee";
import CircleBallIcon from "../components/icons/circleball";
import FanIcon from "../components/icons/fan";
import SpikeIcon from "../components/icons/spike";
import OpensourceIcon from "../components/icons/opensource";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/ui/accordion";

export default function HomePage() {
  const { user } = useJukebox();
  const navigate = useNavigate();

  // Function to get a random cool name
  const getRandomCoolName = () => {
    return names[Math.floor(Math.random() * names.length)];
  };

  const handleCreateJukebox = async (name: string) => {
    if (!user?.id) return;

    try {
      const box = await createBox({ name, slug: name, user_id: user.id });
      if (box.slug) {
        navigate(`/play/${box.slug}`);
      }
    } catch (error) {
      console.error("Failed to create box:", error);
      throw error; // Re-throw to let the dialog handle the error
    }
  };

  return (
    <div>
      <div className="flex flex-1 min-h-[calc(98dvh-70px)] items-center justify-center px-5 w-full bg-background/40 pb-8">
        <div className="flex flex-col justify-center lg:flex-row gap-2 sm:gap-8 mx-auto w-[1300px] max-w-full items-center">
          {/* Left: Marketing Text (raw, not in a Card) */}
          <div className="w-fit p-4 text-center md:px-14 lg:px-0 lg:text-left lg:w-fit flex flex-col items-center lg:items-start">
            {/* Mobile: Badge, Heading, SparkleText above video */}
            <div className="lg:hidden w-full flex flex-col items-center mb-4">
              <div
                className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold shadow-md mb-4 mx-auto"
                style={{
                  borderColor: "#000",
                  color: "#000",
                  background: "#fff",
                  boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)",
                }}
              >
                <Star className="h-4 w-4" />
                100% free no ads!
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-center w-full">
                <span className="text-3xl font-bold leading-tight text-foreground sm:text-5xl sm:leading-tight md:text-6xl lg:text-7xl lg:leading-tight w-fit">
                  Turn any device into a{" "}
                  <span className="mt-2 text-4xl sm:text-6xl md:text-7xl font-bold">
                    <SparkleText>jukebox</SparkleText>
                  </span>
                </span>
              </div>
            </div>
            {/* Desktop: Badge, Heading, Feature List */}
            <div className="hidden lg:block">
              <div
                className="inline-flex rounded-full items-center gap-2 border-2 px-4 py-1.5 text-xs font-bold shadow-md mb-6"
                style={{
                  borderColor: "#000",
                  color: "#000",
                  background: "#fff",
                  boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)",
                }}
              >
                <Star className="h-4 w-4" />
                100% free no ads!
                <Sparkles className="h-4 w-4" />
              </div>
              <h1 className="my-8 text-3xl font-bold leading-tight text-foreground sm:text-5xl sm:leading-tight md:my-0 md:text-6xl lg:text-7xl lg:leading-tight w-fit">
                Turn your phone <br className="hidden md:block" />
                into a <SparkleText>jukebox</SparkleText>
              </h1>
              {/* Feature List (desktop only) */}
              <div className="mt-8 flex-col items-start gap-2 md:flex">
                <p className="text-md flex items-center">
                  <span className="mr-2" role="img" aria-label="open-source">
                    🌐
                  </span>
                  Open source alternative to Spotify's Collaborative Playlists
                </p>
                <p className="text-md flex items-center">
                  <span className="mr-2" role="img" aria-label="anonymous">
                    🕵️
                  </span>
                  Anonymous accounts: no sign up or email needed
                </p>
                <p className="text-md flex items-center">
                  <span className="mr-2" role="img" aria-label="sparkles">
                    ✨
                  </span>
                  Share a link, add songs together
                </p>
                <p className="text-md flex items-center">
                  <span className="mr-2" role="img" aria-label="rocket">
                    🚀
                  </span>
                  No app download or login required
                </p>
              </div>
            </div>
          </div>
          {/* Right: Portrait Video Card with CTA below video */}
          <Card className="flex-[1] flex flex-col items-center justify-center p-4 sm:p-8 bg-white rounded-2xl shadow-md w-full max-w-[400px] gap-0">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 text-center">
              Create a box and share a link for your friends to join and add
              songs.
            </h2>
            <div className="w-full justify-center flex">
              <CreateBoxDialog
                onCreate={handleCreateJukebox}
                defaultName={getRandomCoolName()}
              />
            </div>
            <div className="w-full flex justify-center mt-8">
              <div className="rounded-lg shadow overflow-hidden mx-12 w-full aspect-[1/2] bg-black flex items-center justify-center max-w-[275px]">
                <iframe
                  src="https://player.vimeo.com/video/1099164181?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  style={{
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                  }}
                  title="Jukebox - Free alternative to Spotify Collaborative Playlists"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="w-full">
        <Marquee
          items={[
            // Each item is a container element with icon and text
            <span key="collab" className="flex items-center gap-2">
              Collaborative playlists
              <CircleBallIcon className="inline-block align-middle text-foreground lg:w-[50px] lg:h-[50px] md:w-10 md:h-10 w-[30px] h-[30px] mx-2" />
            </span>,
            <span key="noapp" className="flex items-center gap-2">
              No app required
              <FanIcon
                className="inline-block align-middle mx-2"
                style={{ width: 40, height: 40, verticalAlign: "middle" }}
              />
            </span>,
            <span key="addsongs" className="flex items-center gap-2">
              Add songs from your phone
              <SpikeIcon className="inline-block align-middle text-foreground lg:w-[50px] lg:h-[50px] md:w-10 md:h-10 w-[30px] h-[30px] mx-2" />
            </span>,
            <span key="free" className="flex items-center gap-2">
              100% free, no ads!
              <CircleBallIcon className="inline-block align-middle text-foreground lg:w-[50px] lg:h-[50px] md:w-10 md:h-10 w-[30px] h-[30px] mx-2" />
            </span>,
            <span key="share" className="flex items-center gap-2">
              Share a link, start the party
              <FanIcon
                className="inline-block align-middle mx-2"
                style={{ width: 40, height: 40, verticalAlign: "middle" }}
              />
            </span>,
            <span key="queue" className="flex items-center gap-2">
              Queue up music together
              <SpikeIcon className="inline-block align-middle text-foreground lg:w-[50px] lg:h-[50px] md:w-10 md:h-10 w-[30px] h-[30px] mx-2" />
            </span>,
          ]}
        />
      </div>
      {/* FAQ Section */}
      <div className="w-full bg-main-light py-16 flex flex-col items-center border-b-4 border-black px-5">
        <h2
          id="faq"
          className="text-3xl md:text-4xl font-bold mb-8 text-center"
        >
          Frequently asked questions
        </h2>
        <div className="w-full max-w-xl flex flex-col gap-4">
          <Accordion type="single" collapsible className="flex flex-col gap-4">
            <AccordionItem value="item-1">
              <AccordionTrigger className="bg-main text-black font-semibold">
                Do I need to create an account to use Jukebox?
              </AccordionTrigger>
              <AccordionContent>
                No account or login is required to create or join a jukebox.
                Just create a box and share the link with your friends!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="bg-main text-black font-semibold">
                Which songs are available?
              </AccordionTrigger>
              <AccordionContent>
                Pretty much anything you can find on YouTube or Spotify is
                available to play. The exact source is a secret, but if you can
                find it on those platforms, you can probably queue it here!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="bg-main text-black font-semibold">
                How can I contact you about feature requests?
              </AccordionTrigger>
              <AccordionContent>
                You can reach out by DMing me on{" "}
                <a
                  href="https://twitter.com/skeptrun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  X (formerly Twitter) @skeptrune
                </a>
                . I love hearing your ideas and feedback!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="bg-main text-black font-semibold">
                How to contribute?
              </AccordionTrigger>
              <AccordionContent>
                Open an issue or pull request on{" "}
                <a
                  href="https://github.com/skeptrunedev/jukebox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  GitHub
                </a>
                ! Contributions, suggestions, and improvements are welcome.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      {/* Feature Squares Section */}
      <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-0 border-black overflow-hidden my-0!">
        {/* Square 1: Who made this? */}
        <div className="flex flex-col justify-center p-8 min-h-[220px] border-b-4 border-black md:border-b-0 md:border-r-4 bg-main-light">
          <div className="flex items-center mb-4">
            <CircleBallIcon className="mr-4 w-10 h-10 text-black" />
            <span id="who-made-this" className="text-2xl font-bold text-black">
              Who made this?
            </span>
          </div>
          <p className="text-lg text-black">
            My name is Nick, I love creating software. Spotify's collaborative
            playlists are great, but not everyone has Spotify (including me) so
            I needed something different.
          </p>
        </div>
        {/* Square 2: Open Source */}
        <div className="flex flex-col bg-main justify-center p-8 min-h-[220px] border-black">
          <div className="flex items-center mb-4">
            <OpensourceIcon className="mr-4 w-10 h-10 text-black" />
            <span id="open-source" className="text-2xl font-bold text-black">
              Open Source
            </span>
          </div>
          <p className="text-lg text-black">
            I have some ideas for where this could go! Maybe adding a song could
            be a "paid" feature for businesses to use it like a real jukebox.
            It's open in case someone else has ideas they want to implement.
          </p>
        </div>
        {/* Square 3: What does this do? */}
        <div className="flex flex-col bg-main-light lg:bg-main justify-center p-8 min-h-[220px] border-t-4 border-black md:border-b-0 md:border-r-4">
          <div className="flex items-center mb-4">
            <FanIcon className="mr-4 w-10 h-10 text-black" fill="black" />
            <span
              id="what-does-this-do"
              className="text-2xl font-bold text-black"
            >
              What does this do?
            </span>
          </div>
          <p className="text-lg text-black">
            Right now it's really simple and tiny, kind of a toy project. You
            can create a "box" and then send your friends a link to add songs or
            do it yourself.
          </p>
        </div>
        {/* Square 4: Is it fair if I have a large group? */}
        <div className="flex flex-col justify-center p-8 min-h-[220px] border-t-4 bg-main md:bg-main-light">
          <div className="flex items-center mb-4">
            <SpikeIcon className="mr-4 w-10 h-10 text-black" />
            <span
              id="fair-for-large-group"
              className="text-2xl font-bold text-black"
            >
              Is it fair if I have a large group?
            </span>
          </div>
          <p className="text-lg text-black">
            Yes! When songs get added to the queue, they're automatically sorted
            in a fair order. If person A adds two songs and person B adds one,
            B's song goes between A's. Scales infinitely!
          </p>
        </div>
      </div>
      {/* Changelog Section */}
      <div className="w-full flex flex-col items-center py-16 border-t-4 px-5">
        <Card className="w-full max-w-xl p-8 bg-white border-2 border-black shadow-md">
          <h2
            id="changelog"
            className="text-3xl md:text-4xl font-bold mb-8 text-center"
          >
            Changelog
          </h2>
          <div className="space-y-8">
            <div>
              <h3
                id="changelog-v0-0-17"
                className="text-2xl font-semibold mb-2"
              >
                v0.0.17 (2025-07-08)
              </h3>
              <ul className="list-disc list-inside text-lg ml-4">
                <li>
                  ✨ Enhanced <b>SongSearch</b> and <b>YouTubePlayer</b>{" "}
                  components with additional state management and UI updates
                </li>
                <li>
                  🐳 Updated Docker images to <b>v0.0.16</b>, <b>v0.0.15</b>,{" "}
                  <b>v0.0.14</b>, <b>v0.0.13</b>, <b>v0.0.12</b>, <b>v0.0.8</b>
                </li>
                <li>
                  ⏱️ Adjusted debounce time in <b>SongSearch</b> for improved
                  responsiveness
                </li>
                <li>
                  📧 Added <b>SMTP email notifications</b> for YouTube search
                  failures
                </li>
                <li>
                  🎬 Replaced YouTube video with <b>Vimeo</b> in HomePage
                </li>
                <li>
                  🖼️ Added logo image to <b>README</b> for enhanced visual
                  appeal
                </li>
                <li>
                  🛠️ Enhanced <b>layout</b> component with box context and save
                  icon
                </li>
                <li>
                  🚫 Prevented editing box name on <b>SharePage</b>
                </li>
                <li>
                  📱 Improved drag-and-drop song list behavior for mobile touch
                </li>
                <li>🐞 Fixed bug when all songs are marked as played</li>
                <li>
                  🔄 Reset playback state in <b>YouTubePlayer</b> and refined
                  initial song index logic
                </li>
                <li>🧹 Refined HomePage text and styles</li>
                <li>
                  🤖 Added <b>robots.txt</b>
                </li>
              </ul>
            </div>
            <div>
              <h3 id="changelog-v0-0-4" className="text-2xl font-semibold mb-2">
                v0.0.4 (2025-07-01)
              </h3>
              <ul className="list-disc list-inside text-lg ml-4">
                <li>
                  📧 Added <b>SMTP email notifications</b> for upload success
                  and failure
                </li>
                <li>
                  🛠️ Updated <b>.env.dist</b> and package dependencies
                </li>
                <li>
                  🆕 <b>Box update endpoint</b> now accepts <b>slug</b> or{" "}
                  <b>id</b> and has improved error handling
                </li>
                <li>
                  📊 Added <b>Plausible Analytics</b> for privacy-friendly usage
                  stats
                </li>
              </ul>
            </div>
            <div>
              <h3 id="changelog-v0-0-3" className="text-2xl font-semibold mb-2">
                v0.0.3 (2025-07-01)
              </h3>
              <ul className="list-disc list-inside text-lg ml-4">
                <li>
                  ❤️ Added <b>healthchecks</b> to server and worker services for
                  better reliability
                </li>
                <li>
                  🔁 Ensured <b>server</b> and <b>worker</b> auto-restart via
                  Docker Compose for easier deployment and maintenance
                </li>
                <li>
                  🛠️ Improved environment variable management and added worker
                  configurations for <b>worker1</b>, <b>worker2</b>, and{" "}
                  <b>worker3</b>
                </li>
                <li>
                  🚀 Added <b>redeploy script</b> for streamlined updates
                </li>
              </ul>
            </div>
            <div>
              <h3 id="changelog-v0-0-2" className="text-2xl font-semibold mb-2">
                v0.0.2 (2025-06-30)
              </h3>
              <ul className="list-disc list-inside text-lg ml-4">
                <li>
                  ✨ Enhanced UI with <b>framer-motion</b> animations for a
                  smoother experience in PlayPage and SharePage
                </li>
                <li>
                  ☁️ Added <b>MinIO S3</b> support in Docker Compose—no external
                  S3 needed for VPS deployments
                </li>
                <li>
                  🔄 Streamlined S3 upload process and improved error handling
                  in YouTube worker
                </li>
                <li>
                  📄 Updated README with new features, usage instructions, and
                  badges for Docker pulls, GitHub stars, and social media
                </li>
                <li>
                  🐳 Improved Docker Compose for better service image management
                </li>
              </ul>
            </div>
            <div>
              <h3 id="changelog-v0-0-1" className="text-2xl font-semibold mb-2">
                v0.0.1 (2025-06-30)
              </h3>
              <ul className="list-disc list-inside text-lg ml-4">
                <li>
                  🎵 YouTube Integration: Search and add songs directly from
                  YouTube
                </li>
                <li>
                  📱 Collaborative Playlists: Multiple users can add songs to
                  shared jukeboxes
                </li>
                <li>
                  🎮 Built-in Player: Stream music via embedded YouTube player
                </li>
                <li>🔍 Smart Search: Search YouTube's vast music library</li>
                <li>
                  📊 Playlist Management: Organize and manage your music
                  collections
                </li>
                <li>
                  🖥️ <b>Frontend</b>: React + TypeScript + Vite app for a
                  modern, responsive UI
                </li>
                <li>
                  🗄️ <b>Server</b>: Node.js + Express + TypeScript backend with
                  REST API and OpenAPI/Swagger docs
                </li>
                <li>
                  ⚙️ <b>Worker</b>: Dedicated YouTube audio worker for
                  background processing
                </li>
                <li>💾 SQLite database with Kysely query builder</li>
                <li>
                  🔗 Anonymous, no-login usage—just create a box and share a
                  link
                </li>
                <li>🆓 100% free, no ads, open source (MIT License)</li>
                <li>🌐 Docker support for easy deployment</li>
                <li>
                  📦 Initial release of all core services: server, worker, and
                  frontend
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
      {/* End Changelog Section */}
    </div>
  );
}
