import { useState } from "react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateBoxDialogProps {
  onCreate: (name: string) => Promise<void>;
  defaultName?: string;
  triggerClassName?: string;
  triggerText?: string;
}

export function CreateBoxDialog({
  onCreate,
  defaultName = "",
  triggerClassName = "sm:text-xl hover:cursor-pointer",
  triggerText = "Create Jukebox",
}: CreateBoxDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [isCreating, setIsCreating] = useState(false);

  // Update name when defaultName changes or dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && defaultName) {
      setName(defaultName);
    }
  };

  const handleSubmit = async () => {
    if (!name) return;
    setIsCreating(true);
    try {
      await onCreate(name);
      setOpen(false);
      setName(defaultName);
    } catch (error) {
      console.error("Failed to create jukebox:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className={triggerClassName}>
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new jukebox</DialogTitle>
          <DialogDescription>Enter a name for your jukebox.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Input
            placeholder="Jukebox name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name && !isCreating) {
                handleSubmit();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="neutral">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isCreating || !name}>
            {isCreating ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
