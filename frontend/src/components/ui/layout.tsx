import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Button } from "./button";
import { Input } from "./input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { siGithub, siX } from "simple-icons";
import { useGitHubStars } from "../../hooks/useGitHubStars";
import { getBox, updateBox, createBox } from "../../sdk";
import { CreateBoxDialog } from "../CreateBoxDialog";
import { names } from "../../assets/cool-names";

interface LayoutProps {
  children: ReactNode;
  boxName?: string;
}

export function Layout({ children }: LayoutProps) {
  const { formattedStars, loading } = useGitHubStars("skeptrunedev/jukebox");
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  const [jukeboxName, setJukeboxName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const boxId = params.boxId;
  const isHomePage = location.pathname === "/";
  const hasBoxId = !!boxId;

  // Function to get a random cool name
  const getRandomCoolName = () => {
    return names[Math.floor(Math.random() * names.length)];
  };

  // Load jukebox name when on a box page
  useEffect(() => {
    if (!boxId) {
      setJukeboxName("");
      return;
    }

    (async () => {
      try {
        const box = await getBox(boxId);
        setJukeboxName(box.name || "");
      } catch (error) {
        console.error("Error loading box:", error);
        setJukeboxName("");
      }
    })();
  }, [boxId]);

  const handleCreateJukebox = async (name: string) => {
    try {
      const box = await createBox({ name });
      if (box.id) {
        navigate(`/play/${box.id}`);
      }
    } catch (error) {
      console.error("Failed to create box:", error);
      throw error; // Re-throw to let the dialog handle the error
    }
  };

  const handleSaveName = async () => {
    if (!boxId || !jukeboxName.trim()) return;

    setIsUpdating(true);
    try {
      await updateBox(boxId, { name: jukeboxName.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating box name:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const renderNavbarCenter = () => {
    if (isHomePage) {
      return (
        <CreateBoxDialog
          onCreate={handleCreateJukebox}
          defaultName={getRandomCoolName()}
        />
      );
    }

    if (hasBoxId && jukeboxName) {
      return (
        <TooltipProvider>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={jukeboxName}
                  onChange={(e) => setJukeboxName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveName}
                  className="min-w-[200px]"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={isUpdating}
                >
                  {isUpdating ? "..." : "Save"}
                </Button>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-lg font-semibold text-foreground hover:text-main transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-secondary-background/50"
                  >
                    {jukeboxName}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is the name of your jukebox. Click to edit.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      );
    }

    return null;
  };

  return (
    <>
      <div className="not-prose min-h-[100dvh] bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] [background-size:70px_79px] bg-secondary-background flex flex-col">
        <nav className="mx-auto flex h-[70px] w-full items-center border-b-4 border-border bg-secondary-background px-5">
          <div className="mx-auto flex w-[1300px] text-foreground max-w-full items-center justify-between">
            <div className="flex items-center">
              <a
                className="text-[22px] size-9 rounded-base flex bg-white text-main-foreground border-2 border-black items-center justify-center font-heading"
                href="/"
              >
                J
              </a>
            </div>

            {/* Center content */}
            <div className="flex items-center sm:ml-20">{renderNavbarCenter()}</div>

            <div className="flex items-center gap-4">
              <Button asChild className="bg-white">
                <a
                  href="https://github.com/skeptrunedev/jukebox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-2 items-center"
                >
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d={siGithub.path} />
                  </svg>
                  <span className="hidden sm:inline">
                    {loading ? "..." : formattedStars || "Star"}
                  </span>
                </a>
              </Button>
              <Button asChild size="icon" className="bg-white">
                <a
                  href="https://x.com/skeptrune"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d={siX.path} />
                  </svg>
                </a>
              </Button>
            </div>
          </div>
        </nav>

        {children}

        {/* Footer */}
        <footer className="border-t-4 border-border bg-secondary-background px-5 py-6 mt-auto">
          <div className="mx-auto flex w-[1300px] max-w-full items-center justify-between text-sm text-foreground/70">
            <div className="flex items-center gap-4">
              <span>Contact us: </span>
              <a
                href="mailto:humans@usejukebox.com"
                className="text-main hover:text-main/80 transition-colors"
              >
                humans@usejukebox.com
              </a>
            </div>
            <div className="flex items-center gap-1">
              <span>made with</span>
              <span className="text-red-500 mx-1">♥</span>
              <span>in San Francisco</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
