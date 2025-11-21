import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KnowledgeResource, useKnowledge } from "@/hooks/use-knowledge";
import { ExternalLink, FileText, Image as ImageIcon, Pin, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { srLatn } from "date-fns/locale";

export function ResourceCard({ resource }: { resource: KnowledgeResource }) {
  const { deleteResource, isDeleting, togglePin } = useKnowledge();

  const Icon = {
    NOTE: FileText,
    LINK: ExternalLink,
    IMAGE: ImageIcon,
    PDF: FileText,
  }[resource.type];

  const tags = resource.tags ? JSON.parse(resource.tags) : [];

  return (
    <Card className={`group relative overflow-hidden transition-all hover:shadow-md ${resource.isPinned ? "border-primary/50 bg-primary/5" : ""}`}>
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: resource.subject.color }}
      />
      <CardHeader className="pb-2 pl-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {resource.subject.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(resource.createdAt), "d. MMM", { locale: srLatn })}
              </span>
            </div>
            <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {resource.title}
            </CardTitle>
          </div>
          <div className="flex gap-1">
             <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 transition-opacity ${resource.isPinned ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-muted-foreground"}`}
              onClick={() => togglePin({ id: resource.id, isPinned: !resource.isPinned })}
            >
              <Pin className={`h-4 w-4 ${resource.isPinned ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => deleteResource(resource.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-5">
        {resource.type === "LINK" ? (
          <a
            href={resource.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline line-clamp-2 break-all"
          >
            {resource.content}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {resource.content}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
