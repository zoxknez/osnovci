/**
 * Homework Empty State Component
 * Displayed when no homework is found
 */

"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface HomeworkEmptyStateProps {
  searchQuery: string;
  onAddClick: () => void;
}

export function HomeworkEmptyState({ searchQuery, onAddClick }: HomeworkEmptyStateProps) {
  return (
    <Card className="border-dashed border-2 bg-gray-50/50">
      <CardContent className="p-12 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Search className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Nema zadataka</h3>
        <p className="text-gray-500 mt-1 max-w-xs mx-auto">
          {searchQuery 
            ? "Nismo našli ništa za tvoju pretragu." 
            : "Trenutno nemaš domaćih zadataka. Uživaj u slobodnom vremenu! 🎉"}
        </p>
        <Button 
          className="mt-6"
          onClick={onAddClick}
        >
          Dodaj novi zadatak
        </Button>
      </CardContent>
    </Card>
  );
}

