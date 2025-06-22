import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { createBox } from "../sdk";
import { names } from "../assets/cool-names";
import { CreateBoxDialog } from "../components/CreateBoxDialog";
import { useJukebox } from "@/hooks/useJukeboxContext";

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
      <Card className="text-center bg-white w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Turn your phone into a jukebox
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Share a link with your friends and let the whole group
            collaboratively add songs
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <CreateBoxDialog
            onCreate={handleCreateJukebox}
            defaultName={getRandomCoolName()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
