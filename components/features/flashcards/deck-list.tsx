"use client";

import { BookOpen, MoreVertical, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteDeck, useFlashcardDecks } from "@/lib/hooks/use-flashcards";
import { AddCardDialog } from "./add-card-dialog";
import { StudyMode } from "./study-mode";

interface FlashcardDeck {
  id: string;
  title: string;
  subject: { name: string; icon: string | null; color: string | null };
  _count: { cards: number };
  updatedAt: Date;
}

export function DeckList() {
  const { data: decks, isLoading } = useFlashcardDecks();
  const { mutate: deleteDeck, isPending: isDeleting } = useDeleteDeck();
  const [studyingDeck, setStudyingDeck] = useState<FlashcardDeck | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-8">Učitavanje špilova...</div>;
  }

  if (!decks || decks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <div className="text-4xl mb-4">🗂️</div>
        <h3 className="text-lg font-medium text-gray-900">
          Nemaš nijedan špil
        </h3>
        <p className="text-gray-500 mb-4">
          Napravi svoj prvi špil kartica za učenje!
        </p>
      </div>
    );
  }

  const openDeleteDialog = (id: string) => {
    setDeckToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deckToDelete) return;
    deleteDeck(deckToDelete, {
      onSuccess: () => {
        toast.success("Špil obrisan");
        setDeleteDialogOpen(false);
        setDeckToDelete(null);
      },
      onError: () => toast.error("Greška pri brisanju"),
    });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(decks as FlashcardDeck[]).map((deck) => (
          <Card
            key={deck.id}
            className="flex flex-col hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{deck.subject.icon}</span>
                  <CardTitle className="text-base font-bold text-gray-900">
                    {deck.title}
                  </CardTitle>
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {deck.subject.name}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => openDeleteDialog(deck.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Obriši
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span>{deck._count.cards} kartica</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex gap-2">
              <div className="flex-1">
                <AddCardDialog deckId={deck.id} />
              </div>
              <Button
                className="flex-1 gap-2"
                onClick={() => setStudyingDeck(deck)}
                disabled={deck._count.cards === 0}
              >
                <Play className="h-4 w-4" />
                Uči
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {studyingDeck && (
        <StudyModeWrapper
          deckId={studyingDeck.id}
          onClose={() => setStudyingDeck(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Obriši špil?</DialogTitle>
            <DialogDescription>
              Da li sigurno želiš da obrišeš ovaj špil? Ova akcija se ne može
              poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Otkaži
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Brisanje..." : "Obriši"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Wrapper to fetch cards for the selected deck
import { useFlashcardDeck } from "@/lib/hooks/use-flashcards";

function StudyModeWrapper({
  deckId,
  onClose,
}: {
  deckId: string;
  onClose: () => void;
}) {
  const { data: deck, isLoading } = useFlashcardDeck(deckId);

  if (isLoading) return null;
  if (!deck || !deck.cards) return null;

  return <StudyMode cards={deck.cards} onClose={onClose} />;
}
