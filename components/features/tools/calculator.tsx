"use client";

import { Divide, Equal, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Safe math evaluation without eval()
function safeMathEval(expression: string): number {
  // Sanitize: only allow numbers, operators, decimal points, spaces
  const sanitized = expression.replace(/[^0-9+\-*/.%\s]/g, "");
  if (!sanitized.trim()) return 0;

  // Parse and evaluate safely
  const tokens = sanitized.match(/(\d+\.?\d*|[+\-*/%])/g) || [];
  if (tokens.length === 0) return 0;

  const firstToken = tokens[0];
  if (!firstToken) return 0;
  
  let result = Number.parseFloat(firstToken) || 0;
  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const nextToken = tokens[i + 1];
    const operand = nextToken ? Number.parseFloat(nextToken) || 0 : 0;
    switch (operator) {
      case "+":
        result += operand;
        break;
      case "-":
        result -= operand;
        break;
      case "*":
        result *= operand;
        break;
      case "/":
        result = operand !== 0 ? result / operand : Number.NaN;
        break;
      case "%":
        result = operand !== 0 ? result % operand : Number.NaN;
        break;
    }
  }
  return result;
}

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
    setEquation(`${display} ${op} `);
    setIsNewNumber(true);
  };

  const handleEqual = () => {
    try {
      const result = safeMathEval(equation + display);
      setDisplay(Number.isNaN(result) ? "Error" : String(result));
      setEquation("");
      setIsNewNumber(true);
    } catch {
      setDisplay("Error");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setIsNewNumber(true);
  };

  return (
    <Card
      className="w-full max-w-sm mx-auto bg-gray-900 border-gray-800 shadow-2xl"
      role="application"
      aria-label="Kalkulator"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-100 flex items-center gap-2">
          🧮 Kalkulator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-800 p-4 rounded-xl mb-4 text-right">
          <div className="text-gray-400 text-sm h-6" aria-hidden="true">
            {equation}
          </div>
          <output
            className="text-white text-4xl font-mono font-bold truncate block"
            aria-live="polite"
            aria-atomic="true"
          >
            {display}
          </output>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="secondary"
            onClick={handleClear}
            className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            C
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDisplay(String(parseFloat(display) * -1))}
            className="bg-gray-700 text-gray-200"
          >
            +/-
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleOperator("%")}
            className="bg-gray-700 text-gray-200"
          >
            %
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleOperator("/")}
            className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          >
            <Divide className="h-5 w-5" />
          </Button>

          {[7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="secondary"
              onClick={() => handleNumber(String(num))}
              className="bg-gray-700 text-white text-lg h-12"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="secondary"
            onClick={() => handleOperator("*")}
            className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          >
            <X className="h-5 w-5" />
          </Button>

          {[4, 5, 6].map((num) => (
            <Button
              key={num}
              variant="secondary"
              onClick={() => handleNumber(String(num))}
              className="bg-gray-700 text-white text-lg h-12"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="secondary"
            onClick={() => handleOperator("-")}
            className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          >
            <Minus className="h-5 w-5" />
          </Button>

          {[1, 2, 3].map((num) => (
            <Button
              key={num}
              variant="secondary"
              onClick={() => handleNumber(String(num))}
              className="bg-gray-700 text-white text-lg h-12"
            >
              {num}
            </Button>
          ))}
          <Button
            variant="secondary"
            onClick={() => handleOperator("+")}
            className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleNumber("0")}
            className="col-span-2 bg-gray-700 text-white text-lg h-12"
          >
            0
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleNumber(".")}
            className="bg-gray-700 text-white text-lg h-12"
          >
            .
          </Button>
          <Button
            variant="default"
            onClick={handleEqual}
            className="bg-orange-500 hover:bg-orange-600 text-white h-12"
          >
            <Equal className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
