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
    <div className="bg-background/40">
      <div className="flex flex-1 min-h-[calc(95dvh-70px)] items-center justify-center px-5 w-full">
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
                  <span className="mr-2" role="img" aria-label="sparkles">
                    ✨
                  </span>
                  Share a link with your friends and let the whole group
                  collaboratively add songs
                </p>
                <p className="text-md flex items-center">
                  <span className="mr-2" role="img" aria-label="music">
                    🎵
                  </span>
                  Anyone can queue up music from their phone
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
              Just two steps. Create a box and share a link for your friends to
              join and add songs.
            </h2>
            <div className="w-full justify-center flex">
              <CreateBoxDialog
                onCreate={handleCreateJukebox}
                defaultName={getRandomCoolName()}
              />
            </div>
            <div className="w-full flex justify-center mt-8">
              <div className="rounded-lg shadow overflow-hidden mx-12 w-full aspect-[9/16] bg-black flex items-center justify-center max-w-[275px]">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                  title="How to use Jukebox"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="w-full mt-8">
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
      {/* Feature Squares Section */}
      <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-0 border-black overflow-hidden my-0!">
        {/* Square 1: Who made this? */}
        <div className="flex flex-col justify-center p-8 min-h-[220px] border-b-4 border-black md:border-b-0 md:border-r-4 bg-main-light">
          <div className="flex items-center mb-4">
            <CircleBallIcon className="mr-4 w-10 h-10 text-black" />
            <span className="text-2xl font-bold text-black">
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
        <div className="flex flex-col bg-main justify-center p-8 min-h-[220px] border-b-4 border-black md:border-b-0">
          <div className="flex items-center mb-4">
            <OpensourceIcon className="mr-4 w-10 h-10 text-black" />
            <span className="text-2xl font-bold text-black">Open Source</span>
          </div>
          <p className="text-lg text-black">
            I have some ideas for where this could go! Maybe adding a song could
            be a "paid" feature for businesses to use it like a real jukebox.
            It's open in case someone else has ideas they want to implement.
          </p>
        </div>
        {/* Square 3: What does this do? */}
        <div className="flex flex-col bg-main justify-center p-8 min-h-[220px] border-b-4 border-t-4 border-black md:border-b-0 md:border-r-4">
          <div className="flex items-center mb-4">
            <FanIcon className="mr-4 w-10 h-10 text-black" fill="black" />
            <span className="text-2xl font-bold text-black">
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
        <div className="flex flex-col justify-center p-8 min-h-[220px] border-t-4 bg-main-light">
          <div className="flex items-center mb-4">
            <SpikeIcon className="mr-4 w-10 h-10 text-black" />
            <span className="text-2xl font-bold text-black">
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
    </div>
  );
}
