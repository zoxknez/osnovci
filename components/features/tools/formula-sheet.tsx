"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FORMULAS = {
  matematika: [
    { title: "Pitagorina teorema", formula: "a² + b² = c²", desc: "Za pravougli trougao" },
    { title: "Površina kruga", formula: "P = r²π", desc: "r je poluprečnik" },
    { title: "Obim kruga", formula: "O = 2rπ", desc: "r je poluprečnik" },
    { title: "Kvadrat binoma", formula: "(a ± b)² = a² ± 2ab + b²", desc: "Algebarski izraz" },
    { title: "Razlika kvadrata", formula: "a² - b² = (a - b)(a + b)", desc: "Faktorizacija" },
  ],
  fizika: [
    { title: "Brzina", formula: "v = s / t", desc: "s - put, t - vreme" },
    { title: "Ubrzanje", formula: "a = Δv / t", desc: "Promena brzine u vremenu" },
    { title: "Drugi Njutnov zakon", formula: "F = m · a", desc: "Sila, masa, ubrzanje" },
    { title: "Rad", formula: "A = F · s", desc: "Sila puta put" },
    { title: "Snaga", formula: "P = A / t", desc: "Rad u jedinici vremena" },
  ],
  hemija: [
    { title: "Molarna masa", formula: "M = m / n", desc: "m - masa, n - količina supstance" },
    { title: "Koncentracija", formula: "c = n / V", desc: "n - molovi, V - zapremina" },
    { title: "Gustina", formula: "ρ = m / V", desc: "Odnos mase i zapremine" },
  ]
};

export function FormulaSheet() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("matematika");

  const filterFormulas = (list: typeof FORMULAS.matematika) => {
    return list.filter(f => 
      f.title.toLowerCase().includes(search.toLowerCase()) || 
      f.desc.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <Card className="w-full h-full min-h-[500px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span>📐 Formule</span>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Pretraži formule..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="matematika">Matematika</TabsTrigger>
            <TabsTrigger value="fizika">Fizika</TabsTrigger>
            <TabsTrigger value="hemija">Hemija</TabsTrigger>
          </TabsList>

          {Object.entries(FORMULAS).map(([key, list]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {filterFormulas(list).map((item, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <div className="bg-gray-50 p-2 rounded-md text-center font-mono text-lg font-bold text-blue-600 my-2 border border-gray-100">
                      {item.formula}
                    </div>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
                {filterFormulas(list).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    Nema rezultata pretrage
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
