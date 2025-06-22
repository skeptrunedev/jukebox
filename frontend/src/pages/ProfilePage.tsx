import { useState, useEffect } from "react";
import { useJukebox } from "@/hooks/useJukeboxContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfilePage() {
  const { user, updateUser } = useJukebox();
  const [username, setUsername] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUser({ username: username.trim() });
      setSuccess("Username updated successfully!");
    } catch (err) {
      setError("Failed to update username. Please try again.");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-5 w-full bg-background/40">
      <Card className="bg-white w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Your Profile
          </CardTitle>
          <CardDescription className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            This is how you'll appear to other users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-sm mx-auto">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 text-left"
              >
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full"
                disabled={isUpdating}
              />
            </div>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? "Updating..." : "Update Username"}
            </Button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && (
              <p className="text-green-500 text-sm mt-2">{success}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
