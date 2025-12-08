"use client";

import { Loader } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { ResourceCard } from "@/components/features/knowledge/resource-card";
import { PageHeader } from "@/components/features/page-header";

// Lazy load AddResourceDialog - only needed when user clicks "Add"
const AddResourceDialog = lazy(() =>
  import("@/components/features/knowledge/add-resource-dialog").then((mod) => ({
    default: mod.AddResourceDialog,
  })),
);

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKnowledge } from "@/hooks/use-knowledge";

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { resources, isLoading } = useKnowledge(
    subjectFilter,
    typeFilter === "all" ? undefined : (typeFilter as "NOTE" | "LINK"),
  );

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      return data.subjects || [];
    },
  });

  const filteredResources = resources
    ?.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.content.toLowerCase().includes(search.toLowerCase()) ||
        (r.tags && r.tags.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="📚 Biblioteka Znanja"
        description="Tvoja lična baza beleški, linkova i materijala za učenje."
        action={
          <Suspense fallback={<Loader className="h-4 w-4 animate-spin" />}>
            <AddResourceDialog />
          </Suspense>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži beleške..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Predmet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi predmeti</SelectItem>
            {subjects?.map((s: { id: string; name: string }) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi tipovi</SelectItem>
            <SelectItem value="NOTE">Beleške</SelectItem>
            <SelectItem value="LINK">Linkovi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-lg border bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredResources?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Nema pronađenih resursa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources?.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
