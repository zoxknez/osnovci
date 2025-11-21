"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Divide, Equal, Minus, Plus, X } from "lucide-react";

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ");
    setIsNewNumber(true);
  };

  const handleEqual = () => {
    try {
      // Note: eval is generally unsafe, but for a simple client-side calculator with restricted input, it's acceptable for this demo.
      // In production, use a math parser library.
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation("");
      setIsNewNumber(true);
    } catch (e) {
      setDisplay("Error");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setIsNewNumber(true);
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-gray-900 border-gray-800 shadow-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 flex items-center gap-2">
          🧮 Kalkulator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-800 p-4 rounded-xl mb-4 text-right">
          <div className="text-gray-400 text-sm h-6">{equation}</div>
          <div className="text-white text-4xl font-mono font-bold truncate">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button variant="secondary" onClick={handleClear} className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
            C
          </Button>
          <Button variant="secondary" onClick={() => setDisplay(String(parseFloat(display) * -1))} className="bg-gray-700 text-gray-200">
            +/-
          </Button>
          <Button variant="secondary" onClick={() => handleOperator("%")} className="bg-gray-700 text-gray-200">
            %
          </Button>
          <Button variant="secondary" onClick={() => handleOperator("/")} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
            <Divide className="h-5 w-5" />
          </Button>

          {[7, 8, 9].map((num) => (
            <Button key={num} variant="secondary" onClick={() => handleNumber(String(num))} className="bg-gray-700 text-white text-lg h-12">
              {num}
            </Button>
          ))}
          <Button variant="secondary" onClick={() => handleOperator("*")} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
            <X className="h-5 w-5" />
          </Button>

          {[4, 5, 6].map((num) => (
            <Button key={num} variant="secondary" onClick={() => handleNumber(String(num))} className="bg-gray-700 text-white text-lg h-12">
              {num}
            </Button>
          ))}
          <Button variant="secondary" onClick={() => handleOperator("-")} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
            <Minus className="h-5 w-5" />
          </Button>

          {[1, 2, 3].map((num) => (
            <Button key={num} variant="secondary" onClick={() => handleNumber(String(num))} className="bg-gray-700 text-white text-lg h-12">
              {num}
            </Button>
          ))}
          <Button variant="secondary" onClick={() => handleOperator("+")} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
            <Plus className="h-5 w-5" />
          </Button>

          <Button variant="secondary" onClick={() => handleNumber("0")} className="col-span-2 bg-gray-700 text-white text-lg h-12">
            0
          </Button>
          <Button variant="secondary" onClick={() => handleNumber(".")} className="bg-gray-700 text-white text-lg h-12">
            .
          </Button>
          <Button variant="default" onClick={handleEqual} className="bg-orange-500 hover:bg-orange-600 text-white h-12">
            <Equal className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
