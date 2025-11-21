"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCard } from "@/lib/hooks/use-flashcards";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddCardDialogProps {
  deckId: string;
}

export function AddCardDialog({ deckId }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const { mutate: createCard, isPending } = useCreateCard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front || !back) return;

    createCard(
      {
        deckId,
        data: { front, back },
      },
      {
        onSuccess: () => {
          toast.success("Kartica dodata!");
          setFront("");
          setBack("");
          // Keep dialog open for adding more cards
          const frontInput = document.getElementById("front");
          if (frontInput) frontInput.focus();
        },
        onError: () => {
          toast.error("Greška pri dodavanju kartice");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj Karticu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj novu karticu</DialogTitle>
          <DialogDescription>
            Upiši pitanje na prednjoj strani i odgovor na zadnjoj.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Pitanje (Prednja strana)</Label>
            <Input
              id="front"
              placeholder="npr. Dog"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Odgovor (Zadnja strana)</Label>
            <Textarea
              id="back"
              placeholder="npr. Pas"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dodaj
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
