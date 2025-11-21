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
import { Textarea } from "@/components/ui/textarea";
import { useKnowledge } from "@/hooks/use-knowledge";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

export function AddResourceDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"NOTE" | "LINK">("NOTE");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [tags, setTags] = useState("");

  const { addResource, isAdding } = useKnowledge();

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      return data.subjects || [];
    },
  });

  const handleSubmit = () => {
    if (!title || !content || !subjectId) return;

    addResource(
      {
        title,
        type,
        content,
        subjectId,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setContent("");
          setTags("");
          setSubjectId("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj Resurs
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj u Biblioteku</DialogTitle>
          <DialogDescription>
            Sačuvaj belešku, link ili sliku za kasnije učenje.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Naslov</Label>
            <Input
              placeholder="npr. Formule iz fizike"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Predmet</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Izaberi..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tip</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "NOTE" | "LINK")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Beleška</SelectItem>
                  <SelectItem value="LINK">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{type === "LINK" ? "URL Linka" : "Sadržaj"}</Label>
            {type === "LINK" ? (
              <Input
                placeholder="https://..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <Textarea
                placeholder="Upiši belešku ovde..."
                className="min-h-[100px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Tagovi (odvojeni zarezom)</Label>
            <Input
              placeholder="formule, definicije, važno"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isAdding}>
            Sačuvaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
