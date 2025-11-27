/**
 * Educational Mini-Games Component
 * Edukativne mini-igre za učenike
 * Math quiz, Word scramble, Memory game
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Calculator,
  BookA,
  Brain,
  Star,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Game Types
type GameType = "math" | "words" | "memory";
type Difficulty = "easy" | "medium" | "hard";

interface GameResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  xpEarned: number;
}

interface MiniGamesProps {
  studentId: string;
  studentGrade?: number; // 1-8
  onGameComplete?: (result: GameResult, gameType: GameType) => void;
}

// XP rewards based on difficulty
const XP_REWARDS: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 40,
};

export function MiniGames({
  studentId: _studentId,
  studentGrade = 4,
  onGameComplete,
}: MiniGamesProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const games = [
    {
      id: "math" as GameType,
      name: "Matematički Kviz",
      description: "Rešavaj matematičke zadatke",
      icon: Calculator,
      color: "bg-blue-500",
    },
    {
      id: "words" as GameType,
      name: "Slova u Reči",
      description: "Pronađi reč od pomešanih slova",
      icon: BookA,
      color: "bg-green-500",
    },
    {
      id: "memory" as GameType,
      name: "Memorija",
      description: "Pronađi parove kartica",
      icon: Brain,
      color: "bg-purple-500",
    },
  ];

  if (activeGame === "math") {
    return (
      <MathQuiz
        difficulty={difficulty}
        studentGrade={studentGrade}
        soundEnabled={soundEnabled}
        onComplete={(result) => {
          onGameComplete?.(result, "math");
          setActiveGame(null);
        }}
        onBack={() => setActiveGame(null)}
      />
    );
  }

  if (activeGame === "words") {
    return (
      <WordScramble
        difficulty={difficulty}
        soundEnabled={soundEnabled}
        onComplete={(result) => {
          onGameComplete?.(result, "words");
          setActiveGame(null);
        }}
        onBack={() => setActiveGame(null)}
      />
    );
  }

  if (activeGame === "memory") {
    return (
      <MemoryGame
        difficulty={difficulty}
        soundEnabled={soundEnabled}
        onComplete={(result) => {
          onGameComplete?.(result, "memory");
          setActiveGame(null);
        }}
        onBack={() => setActiveGame(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            Edukativne Igre
          </h2>
          <p className="text-muted-foreground">
            Uči igrajući se i zaradi XP!
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Difficulty Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Težina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <Button
                key={d}
                variant={difficulty === d ? "default" : "outline"}
                onClick={() => setDifficulty(d)}
                className="flex-1"
              >
                {d === "easy" && "Lako"}
                {d === "medium" && "Srednje"}
                {d === "hard" && "Teško"}
                <Badge variant="secondary" className="ml-2">
                  +{XP_REWARDS[d]} XP
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Game Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {games.map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setActiveGame(game.id)}
            >
              <CardHeader>
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-2",
                    game.color
                  )}
                >
                  <game.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Igraj</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Math Quiz Component
function MathQuiz({
  difficulty,
  studentGrade: _studentGrade,
  soundEnabled,
  onComplete,
  onBack,
}: {
  difficulty: Difficulty;
  studentGrade: number;
  soundEnabled: boolean;
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);

  const totalQuestions = difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 10;

  const generateQuestion = useCallback(() => {
    const maxNum =
      difficulty === "easy" ? 10 : difficulty === "medium" ? 50 : 100;
    const operations =
      difficulty === "easy"
        ? ["+", "-"]
        : difficulty === "medium"
        ? ["+", "-", "*"]
        : ["+", "-", "*", "/"];

    const op = operations[Math.floor(Math.random() * operations.length)];
    let a = Math.floor(Math.random() * maxNum) + 1;
    let b = Math.floor(Math.random() * maxNum) + 1;

    // Ensure division results in whole numbers
    if (op === "/") {
      b = Math.floor(Math.random() * 10) + 1;
      a = b * (Math.floor(Math.random() * 10) + 1);
    }

    // Ensure subtraction doesn't go negative for easy mode
    if (op === "-" && difficulty === "easy" && b > a) {
      [a, b] = [b, a];
    }

    let correctAnswer: number;
    switch (op) {
      case "+":
        correctAnswer = a + b;
        break;
      case "-":
        correctAnswer = a - b;
        break;
      case "*":
        correctAnswer = a * b;
        break;
      case "/":
        correctAnswer = a / b;
        break;
      default:
        correctAnswer = a + b;
    }

    return { a, b, op, correctAnswer };
  }, [difficulty]);

  const [questions] = useState(() =>
    Array.from({ length: totalQuestions }, generateQuestion)
  );

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver]);

  const handleSubmit = () => {
    const currentQ = questions[currentQuestion];
    if (!currentQ) return;
    
    const isCorrect = parseInt(answer) === currentQ.correctAnswer;

    setShowResult(isCorrect);
    if (isCorrect) {
      setScore((prev) => prev + 1);
      if (soundEnabled) {
        // Play success sound
      }
    }

    setTimeout(() => {
      setShowResult(null);
      setAnswer("");

      if (currentQuestion + 1 >= totalQuestions) {
        setGameOver(true);
      } else {
        setCurrentQuestion((prev) => prev + 1);
      }
    }, 1000);
  };

  if (gameOver) {
    const xpEarned = score * XP_REWARDS[difficulty];
    const result: GameResult = {
      score,
      correctAnswers: score,
      totalQuestions,
      timeSpent: 60 - timeLeft,
      xpEarned,
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold">Igra Završena!</h2>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">
                {score} / {totalQuestions}
              </p>
              <p className="text-muted-foreground">tačnih odgovora</p>
            </div>
            <Badge className="text-lg px-4 py-2">+{xpEarned} XP</Badge>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={onBack}>
                Nazad
              </Button>
              <Button
                onClick={() => {
                  onComplete(result);
                }}
              >
                Završi
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const q = questions[currentQuestion];
  
  if (!q) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Nazad
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              <Star className="h-3 w-3 mr-1" />
              {score} / {totalQuestions}
            </Badge>
            <Badge variant={timeLeft < 10 ? "destructive" : "outline"}>
              <Clock className="h-3 w-3 mr-1" />
              {timeLeft}s
            </Badge>
          </div>
        </div>
        <Progress
          value={(currentQuestion / totalQuestions) * 100}
          className="mt-4"
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <motion.p
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold font-mono"
          >
            {q.a} {q.op} {q.b} = ?
          </motion.p>
        </div>

        <div className="flex gap-4 max-w-xs mx-auto">
          <Input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Unesite odgovor"
            className={cn(
              "text-center text-2xl",
              showResult === true && "border-green-500 bg-green-50",
              showResult === false && "border-red-500 bg-red-50"
            )}
            autoFocus
          />
          <Button onClick={handleSubmit} disabled={!answer}>
            OK
          </Button>
        </div>

        <AnimatePresence>
          {showResult !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-center"
            >
              {showResult ? (
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              ) : (
                <div className="space-y-2">
                  <XCircle className="h-12 w-12 mx-auto text-red-500" />
                  <p className="text-muted-foreground">
                    Tačan odgovor: {q.correctAnswer}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Word Scramble Component
function WordScramble({
  difficulty,
  soundEnabled: _soundEnabled,
  onComplete,
  onBack,
}: {
  difficulty: Difficulty;
  soundEnabled: boolean;
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}) {
  const words = useMemo(() => {
    const wordLists: Record<Difficulty, string[]> = {
      easy: ["kuća", "mama", "tata", "sunce", "voda", "pas", "mačka", "škola"],
      medium: [
        "prijatelj",
        "učiteljica",
        "domaći",
        "razred",
        "knjiga",
        "olovka",
        "sveska",
        "priroda",
      ],
      hard: [
        "matematika",
        "geografija",
        "istorija",
        "literatura",
        "obrazovanje",
        "informatika",
      ],
    };
    return wordLists[difficulty].sort(() => Math.random() - 0.5).slice(0, 5);
  }, [difficulty]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const scrambleWord = (word: string): string => {
    const arr = word.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j] ?? "";
      arr[j] = temp ?? "";
    }
    // Make sure scrambled word is different
    if (arr.join("") === word) {
      return scrambleWord(word);
    }
    return arr.join("");
  };

  const scrambledWords = useMemo(
    () => words.map((w) => scrambleWord(w)),
    [words]
  );

  const handleSubmit = () => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;
    
    const isCorrect = guess.toLowerCase() === currentWord.toLowerCase();
    setShowResult(isCorrect);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setShowResult(null);
      setGuess("");

      if (currentIndex + 1 >= words.length) {
        setGameOver(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1500);
  };

  if (gameOver) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const xpEarned = score * XP_REWARDS[difficulty];
    const result: GameResult = {
      score,
      correctAnswers: score,
      totalQuestions: words.length,
      timeSpent,
      xpEarned,
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold">Bravo!</h2>
            <p className="text-4xl font-bold text-primary">
              {score} / {words.length}
            </p>
            <Badge className="text-lg px-4 py-2">+{xpEarned} XP</Badge>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={onBack}>
                Nazad
              </Button>
              <Button onClick={() => onComplete(result)}>Završi</Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const currentScrambled = scrambledWords[currentIndex];
  if (!currentScrambled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Nazad
          </Button>
          <Badge variant="secondary">
            {currentIndex + 1} / {words.length}
          </Badge>
        </div>
        <Progress value={((currentIndex + 1) / words.length) * 100} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Pronađi reč od ovih slova:
          </p>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center gap-2"
          >
            {currentScrambled.split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg text-xl font-bold"
              >
                {letter.toUpperCase()}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <div className="flex gap-4 max-w-xs mx-auto">
          <Input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Unesite reč"
            className={cn(
              "text-center",
              showResult === true && "border-green-500 bg-green-50",
              showResult === false && "border-red-500 bg-red-50"
            )}
            autoFocus
          />
          <Button onClick={handleSubmit} disabled={!guess}>
            OK
          </Button>
        </div>

        <AnimatePresence>
          {showResult !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-center"
            >
              {showResult ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                  <p className="font-bold text-green-600">Tačno!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <XCircle className="h-12 w-12 mx-auto text-red-500" />
                  <p className="text-muted-foreground">
                    Tačan odgovor: {words[currentIndex]}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Memory Game Component
function MemoryGame({
  difficulty,
  soundEnabled: _soundEnabled,
  onComplete,
  onBack,
}: {
  difficulty: Difficulty;
  soundEnabled: boolean;
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}) {
  const pairCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8;
  const emojis = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍉", "🥝", "🍒", "🥭", "🍍"];

  const [cards, setCards] = useState<
    { id: number; emoji: string; isFlipped: boolean; isMatched: boolean }[]
  >([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const selectedEmojis = emojis.slice(0, pairCount);
    const cardPairs = [...selectedEmojis, ...selectedEmojis]
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(cardPairs);
  }, [pairCount]);

  const handleCardClick = (cardId: number) => {
    const clickedCard = cards[cardId];
    if (flippedCards.length === 2) return;
    if (!clickedCard || clickedCard.isMatched) return;
    if (flippedCards.includes(cardId)) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);

      const first = newFlipped[0];
      const second = newFlipped[1];
      if (first === undefined || second === undefined) return;
      
      const firstCard = cards[first];
      const secondCard = cards[second];
      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        setCards((prev) =>
          prev.map((card) =>
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card
          )
        );
        setMatches((prev) => {
          const newMatches = prev + 1;
          if (newMatches === pairCount) {
            setTimeout(() => setGameOver(true), 500);
          }
          return newMatches;
        });
        setFlippedCards([]);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  if (gameOver) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const efficiency = Math.max(0, 100 - (moves - pairCount) * 5);
    const xpEarned = Math.floor((XP_REWARDS[difficulty] * efficiency) / 100) * pairCount;

    const result: GameResult = {
      score: efficiency,
      correctAnswers: pairCount,
      totalQuestions: pairCount,
      timeSpent,
      xpEarned,
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            <h2 className="text-2xl font-bold">Odlično!</h2>
            <div className="space-y-2">
              <p>Pronašli ste sve parove</p>
              <p className="text-muted-foreground">u {moves} poteza</p>
            </div>
            <Badge className="text-lg px-4 py-2">+{xpEarned} XP</Badge>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={onBack}>
                Nazad
              </Button>
              <Button onClick={() => onComplete(result)}>Završi</Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Nazad
          </Button>
          <div className="flex gap-4">
            <Badge variant="secondary">Potezi: {moves}</Badge>
            <Badge variant="outline">
              {matches} / {pairCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid gap-2",
            pairCount <= 4 && "grid-cols-4",
            pairCount === 6 && "grid-cols-4",
            pairCount === 8 && "grid-cols-4"
          )}
        >
          {cards.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={cn(
                "aspect-square rounded-lg text-3xl flex items-center justify-center",
                "transition-all duration-200",
                card.isFlipped || card.isMatched
                  ? "bg-primary/10"
                  : "bg-muted hover:bg-muted/80",
                card.isMatched && "bg-green-100"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {(card.isFlipped || card.isMatched) && (
                  <motion.span
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    exit={{ rotateY: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {card.emoji}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default MiniGames;
