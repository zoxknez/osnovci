"use client";

import { Book, Calculator as CalcIcon, Library, Loader } from "lucide-react";
import { lazy, Suspense } from "react";
import { SectionErrorBoundary } from "@/components/error-boundary";
import { PageHeader } from "@/components/features/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Lazy load heavy components - only load when tab is active
const CreateDeckDialog = lazy(() =>
  import("@/components/features/flashcards/create-deck-dialog").then((mod) => ({
    default: mod.CreateDeckDialog,
  })),
);
const DeckList = lazy(() =>
  import("@/components/features/flashcards/deck-list").then((mod) => ({
    default: mod.DeckList,
  })),
);
const Calculator = lazy(() =>
  import("@/components/features/tools/calculator").then((mod) => ({
    default: mod.Calculator,
  })),
);
const FormulaSheet = lazy(() =>
  import("@/components/features/tools/formula-sheet").then((mod) => ({
    default: mod.FormulaSheet,
  })),
);

export default function PernicaPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="🎒 Digitalna Pernica"
        description="Svi alati koji ti trebaju za učenje na jednom mestu"
        variant="blue"
      />

      <Tabs defaultValue="flashcards" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mx-auto mb-8">
          <TabsTrigger value="flashcards" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Kartice</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <CalcIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Kalkulator</span>
          </TabsTrigger>
          <TabsTrigger value="formulas" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            <span className="hidden sm:inline">Formule</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tvoje Kartice</h2>
            <Suspense fallback={<Loader className="h-4 w-4 animate-spin" />}>
              <CreateDeckDialog />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }
          >
            <SectionErrorBoundary sectionName="Kartice">
              <DeckList />
            </SectionErrorBoundary>
          </Suspense>
        </TabsContent>

        <TabsContent value="calculator">
          <div className="py-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              }
            >
              <SectionErrorBoundary sectionName="Kalkulator">
                <Calculator />
              </SectionErrorBoundary>
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="formulas">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            }
          >
            <SectionErrorBoundary sectionName="Formule">
              <FormulaSheet />
            </SectionErrorBoundary>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
