import { PageHeader } from "@/components/features/page-header";
import { CreateDeckDialog } from "@/components/features/flashcards/create-deck-dialog";
import { DeckList } from "@/components/features/flashcards/deck-list";
import { Calculator } from "@/components/features/tools/calculator";
import { FormulaSheet } from "@/components/features/tools/formula-sheet";
import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator as CalcIcon, Book, Library } from "lucide-react";

export const metadata: Metadata = {
  title: "Digitalna Pernica | Osnovci",
  description: "Tvoji alati za učenje - fleš kartice, kalkulator i formule",
};

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
            <CreateDeckDialog />
          </div>
          <DeckList />
        </TabsContent>

        <TabsContent value="calculator">
          <div className="py-8">
            <Calculator />
          </div>
        </TabsContent>

        <TabsContent value="formulas">
          <FormulaSheet />
        </TabsContent>
      </Tabs>
    </div>
  );
}
