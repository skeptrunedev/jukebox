import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "./button";
import { Input } from "./input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { siGithub, siX } from "simple-icons";
import { Edit, User as UserIcon, SaveIcon } from "lucide-react";
import { useGitHubStars } from "../../hooks/useGitHubStars";
import { updateBox, createBox } from "../../sdk";
import { CreateBoxDialog } from "../CreateBoxDialog";
import { names } from "../../assets/cool-names";
import { useJukebox } from "@/hooks/useJukeboxContext";

interface LayoutProps {
  children: ReactNode;
  boxName?: string;
}

export function Layout({ children }: LayoutProps) {
  const { user, box } = useJukebox();
  const { formattedStars, loading } = useGitHubStars("skeptrunedev/jukebox");
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  const [jukeboxName, setJukeboxName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const boxSlug = params.boxSlug;
  const isHomePage = location.pathname === "/";
  const isProfilePage = location.pathname === "/profile";
  const isPlayPage = location.pathname.startsWith("/play/");
  const hasBoxSlug = !!boxSlug;

  // Function to get a random cool name
  const getRandomCoolName = () => {
    return names[Math.floor(Math.random() * names.length)];
  };

  // Load jukebox name when on a box page
  useEffect(() => {
    if (!box) {
      setJukeboxName("");
      return;
    }

    setJukeboxName(box.name || "");
  }, [box]);

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

  const handleSaveName = async () => {
    if (!boxSlug || !jukeboxName.trim()) {
      setJukeboxName(box?.name || "");
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await updateBox(boxSlug, { name: jukeboxName.trim() });
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
    if (isHomePage || isProfilePage) {
      return (
        <CreateBoxDialog
          onCreate={handleCreateJukebox}
          defaultName={getRandomCoolName()}
        />
      );
    }

    if (hasBoxSlug && isPlayPage) {
      return (
        <TooltipProvider>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2 px-2">
                <Input
                  value={jukeboxName}
                  onChange={(e) => setJukeboxName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-w-[200px]"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={isUpdating}
                >
                  {isUpdating ? "..." : <SaveIcon className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="sm:text-lg font-semibold text-foreground hover:text-main transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-secondary-background/50 flex items-center gap-2"
                  >
                    <span>{jukeboxName}</span>
                    <Edit className="h-4 w-4 opacity-60" />
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
    } else if (hasBoxSlug) {
      return (
        <p className="sm:text-lg font-semibold text-foreground hover:text-main transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-secondary-background/50 flex items-center gap-2">
          {jukeboxName}
        </p>
      );
    }

    return null;
  };

  return (
    <>
      <div className="not-prose min-h-[100dvh] bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] [background-size:70px_79px] bg-secondary-background flex flex-col">
        <nav className="mx-auto flex h-[70px] w-full items-center border-b-4 border-border bg-secondary-background px-5">
          <div className="mx-auto flex w-[1300px] text-foreground max-w-full items-center justify-between sm:grid sm:grid-cols-3">
            <div className="flex items-center">
              <a
                className={`size-9 rounded-base flex text-main-foreground border-2 border-black items-center justify-center font-heading ${
                  hasBoxSlug ? "bg-main" : "bg-white"
                }`}
                href="/"
              >
                <img
                  src="/favicon-32x32.png"
                  alt="Jukebox Logo"
                  className="w-6 h-6"
                />
              </a>
            </div>

            {/* Center content */}
            <div className="flex items-center justify-center">
              {renderNavbarCenter()}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 justify-end">
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
              <Button asChild size="icon" className="bg-white">
                <Link to="/profile">
                  <UserIcon className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </nav>

        {children}

        {/* Footer */}
        <footer className="border-t-4 border-border bg-secondary-background px-5 py-6">
          <div className="mx-auto flex w-[1300px] max-w-full flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 text-sm text-foreground/70">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
              <span>Contact:</span>
              <a
                href="https://x.com/skeptrune"
                className="text-main hover:text-main/80 transition-colors"
              >
                DM @skeptrune on X
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
