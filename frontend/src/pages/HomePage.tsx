import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { createBox } from "../sdk";
import { names } from "../assets/cool-names";
import { CreateBoxDialog } from "../components/CreateBoxDialog";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { Star, Sparkles } from "lucide-react";
import { SparkleText } from "../components/ui/SparkleText";

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
    <div className="flex flex-1 items-center justify-center px-5 w-full bg-background/40">
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
              className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold shadow-md mb-6"
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
  );
}
