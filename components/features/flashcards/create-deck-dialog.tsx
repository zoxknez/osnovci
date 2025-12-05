"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubjects } from "@/hooks/use-subjects";
import { useCreateDeck } from "@/lib/hooks/use-flashcards";

export function CreateDeckDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const { data: subjects } = useSubjects();
  const { mutate: createDeck, isPending } = useCreateDeck();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId) return;

    const selectedSubject = subjects?.find((s) => s.id === subjectId);

    createDeck(
      {
        title,
        subjectId,
        ...(selectedSubject?.color && { color: selectedSubject.color }),
      },
      {
        onSuccess: () => {
          toast.success("Špil kreiran!");
          setOpen(false);
          setTitle("");
          setSubjectId("");
        },
        onError: () => {
          toast.error("Greška pri kreiranju špila");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novi Špil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Napravi novi špil kartica</DialogTitle>
          <DialogDescription>
            Izaberi predmet i naziv za tvoj novi set kartica za učenje.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Naziv špila</Label>
            <Input
              id="title"
              placeholder="npr. Engleski reči - Životinje"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-select">Predmet</Label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger
                id="subject-select"
                aria-labelledby="subject-select"
              >
                <SelectValue placeholder="Izaberi predmet" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <div className="flex items-center gap-2">
                      <span>{subject.icon}</span>
                      <span>{subject.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kreiraj
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
