import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { createBox } from "@/sdk";
import { siX, siInstagram, siGithub } from "simple-icons";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const box = await createBox({ name: "My Jukebox" });
      if (box.id) {
        navigate(`/play/${box.id}`);
      }
    } catch (error) {
      console.error("Failed to create box:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card>
        <CardHeader>
          <h1 className="text-4xl font-bold">Jukebox</h1>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-6 justify-center">
            <a
              href="https://twitter.com/usejukebox"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={siX.path} />
              </svg>
            </a>
            <a
              href="https://instagram.com/usejukebox"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={siInstagram.path} />
              </svg>
            </a>
            <a
              href="https://github.com/skeptrunedev/jukebox"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={siGithub.path} />
              </svg>
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex space-x-4 justify-center">
          <Button asChild variant="neutral">
            <a
              href="https://github.com/skeptrunedev/jukebox"
              target="_blank"
              rel="noopener noreferrer"
            >
              Star us
            </a>
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Jukebox"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
