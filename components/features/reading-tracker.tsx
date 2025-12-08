/**
 * Reading Tracker Component
 * Praćenje čitanja knjiga za učenike
 * Gamified reading with XP rewards
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookMarked,
  BookOpen,
  CheckCircle,
  Clock,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  Star,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  startDate: Date;
  endDate?: Date | undefined;
  isCompleted: boolean;
  coverColor: string;
  xpEarned: number;
}

interface ReadingSession {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  duration: number; // in minutes
  date: Date;
  xpEarned: number;
}

interface ReadingTrackerProps {
  studentId: string;
  onXPEarned?: (xp: number, reason: string) => void;
  initialBooks?: Book[];
}

const BOOK_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
];

const XP_PER_PAGE = 2;
const XP_BOOK_COMPLETION_BONUS = 100;
const XP_DAILY_READING_BONUS = 25;

export function ReadingTracker({
  onXPEarned,
  initialBooks = [],
}: ReadingTrackerProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [activeSession, setActiveSession] = useState<{
    bookId: string;
    startPage: number;
    startTime: Date;
  } | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    totalPages: 0,
  });
  const [isLoading] = useState(false);

  // Timer for active reading session
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeSession) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  // Calculate stats
  const stats = {
    totalBooks: books.length,
    completedBooks: books.filter((b) => b.isCompleted).length,
    totalPagesRead: books.reduce((sum, b) => sum + b.currentPage, 0),
    totalXP: books.reduce((sum, b) => sum + b.xpEarned, 0),
    currentStreak: calculateReadingStreak(sessions),
  };

  function calculateReadingStreak(allSessions: ReadingSession[]): number {
    if (allSessions.length === 0) return 0;

    const sortedSessions = [...allSessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }

    return streak;
  }

  // Add new book
  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || newBook.totalPages <= 0) {
      toast.error("Molimo popunite sva polja");
      return;
    }

    const book: Book = {
      id: `book-${Date.now()}`,
      title: newBook.title,
      author: newBook.author,
      totalPages: newBook.totalPages,
      currentPage: 0,
      startDate: new Date(),
      isCompleted: false,
      coverColor:
        BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)] ??
        "bg-blue-500",
      xpEarned: 0,
    };

    setBooks((prev) => [...prev, book]);
    setNewBook({ title: "", author: "", totalPages: 0 });
    setIsAddingBook(false);
    toast.success(`📚 Dodato: "${book.title}"`);
  };

  // Start reading session
  const startReading = (book: Book) => {
    if (activeSession) {
      toast.error("Već čitate drugu knjigu. Završite trenutnu sesiju.");
      return;
    }

    setActiveSession({
      bookId: book.id,
      startPage: book.currentPage,
      startTime: new Date(),
    });

    toast.success(`📖 Počeli ste čitati "${book.title}"`);
  };

  // End reading session
  const endReading = (endPage: number) => {
    if (!activeSession) return;

    const book = books.find((b) => b.id === activeSession.bookId);
    if (!book) return;

    const pagesRead = endPage - activeSession.startPage;
    const duration = Math.floor(timerSeconds / 60);

    if (pagesRead <= 0) {
      toast.error("Molimo unesite stranicu veću od početne");
      return;
    }

    // Calculate XP
    let xpEarned = pagesRead * XP_PER_PAGE;
    const isCompleted = endPage >= book.totalPages;

    // Check if this is first reading today for daily bonus
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasReadToday = sessions.some((s) => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });

    if (!hasReadToday) {
      xpEarned += XP_DAILY_READING_BONUS;
      toast.success(
        `🌟 +${XP_DAILY_READING_BONUS} XP bonus za dnevno čitanje!`,
      );
    }

    if (isCompleted) {
      xpEarned += XP_BOOK_COMPLETION_BONUS;
      toast.success(
        `🏆 +${XP_BOOK_COMPLETION_BONUS} XP bonus za završenu knjigu!`,
      );
    }

    // Create session
    const session: ReadingSession = {
      id: `session-${Date.now()}`,
      bookId: book.id,
      startPage: activeSession.startPage,
      endPage,
      duration,
      date: new Date(),
      xpEarned,
    };

    setSessions((prev) => [...prev, session]);

    // Update book
    setBooks((prev) =>
      prev.map(
        (b): Book =>
          b.id === book.id
            ? {
                ...b,
                currentPage: endPage,
                isCompleted,
                endDate: isCompleted ? new Date() : b.endDate,
                xpEarned: b.xpEarned + xpEarned,
              }
            : b,
      ),
    );

    // Notify parent about XP
    if (onXPEarned) {
      onXPEarned(xpEarned, `Pročitano ${pagesRead} stranica`);
    }

    setActiveSession(null);

    toast.success(
      `✅ Sesija završena! Pročitano ${pagesRead} stranica, zarađeno ${xpEarned} XP`,
    );
  };

  // Update page manually
  const updatePage = (bookId: string, delta: number) => {
    setBooks((prev) =>
      prev.map((book): Book => {
        if (book.id !== bookId) return book;

        const newPage = Math.max(
          0,
          Math.min(book.totalPages, book.currentPage + delta),
        );
        const isCompleted = newPage >= book.totalPages;

        return {
          ...book,
          currentPage: newPage,
          isCompleted,
          endDate: isCompleted ? new Date() : book.endDate,
        };
      }),
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.totalBooks}</p>
          <p className="text-xs text-muted-foreground">Knjiga</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{stats.completedBooks}</p>
          <p className="text-xs text-muted-foreground">Završeno</p>
        </Card>
        <Card className="p-4 text-center">
          <BookMarked className="h-6 w-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{stats.totalPagesRead}</p>
          <p className="text-xs text-muted-foreground">Stranica</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-bold">{stats.totalXP}</p>
          <p className="text-xs text-muted-foreground">XP</p>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="h-6 w-6 mx-auto mb-2 text-orange-500" />
          <p className="text-2xl font-bold">{stats.currentStreak}</p>
          <p className="text-xs text-muted-foreground">Dana zaredom</p>
        </Card>
      </div>

      {/* Active Session */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <BookOpen className="h-5 w-5 text-primary" />
                  </motion.div>
                  Trenutno čitanje
                </CardTitle>
                <CardDescription>
                  {books.find((b) => b.id === activeSession.bookId)?.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-3xl font-mono font-bold">
                    {formatTime(timerSeconds)}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>Do koje stranice ste stigli?</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`Veće od ${activeSession.startPage}`}
                      min={activeSession.startPage + 1}
                      max={
                        books.find((b) => b.id === activeSession.bookId)
                          ?.totalPages
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.target as HTMLInputElement;
                          endReading(parseInt(target.value));
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        const input = document.querySelector(
                          'input[type="number"]',
                        ) as HTMLInputElement;
                        if (input) {
                          endReading(parseInt(input.value));
                        }
                      }}
                    >
                      Završi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Books List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Moje knjige</h3>
          <Dialog open={isAddingBook} onOpenChange={setIsAddingBook}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Dodaj knjigu
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj novu knjigu</DialogTitle>
                <DialogDescription>
                  Unesite informacije o knjizi koju želite da pratite.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Naslov</Label>
                  <Input
                    id="title"
                    value={newBook.title}
                    onChange={(e) =>
                      setNewBook({ ...newBook, title: e.target.value })
                    }
                    placeholder="Naziv knjige"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={newBook.author}
                    onChange={(e) =>
                      setNewBook({ ...newBook, author: e.target.value })
                    }
                    placeholder="Ime autora"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pages">Broj stranica</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={newBook.totalPages || ""}
                    onChange={(e) =>
                      setNewBook({
                        ...newBook,
                        totalPages: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    min={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingBook(false)}
                >
                  Otkaži
                </Button>
                <Button onClick={handleAddBook} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Dodaj
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {books.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Još nema knjiga.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dodajte svoju prvu knjigu da počnete sa praćenjem čitanja!
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <Card
                  className={cn(
                    "relative overflow-hidden",
                    book.isCompleted && "border-green-500",
                  )}
                >
                  {/* Book spine color */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-2",
                      book.coverColor,
                    )}
                  />

                  <CardHeader className="pl-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {book.title}
                        </CardTitle>
                        <CardDescription>{book.author}</CardDescription>
                      </div>
                      {book.isCompleted && (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Završeno
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pl-6 space-y-3">
                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Napredak</span>
                        <span className="font-medium">
                          {book.currentPage} / {book.totalPages}
                        </span>
                      </div>
                      <Progress
                        value={(book.currentPage / book.totalPages) * 100}
                        className="h-2"
                      />
                    </div>

                    {/* XP earned */}
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{book.xpEarned} XP zarađeno</span>
                    </div>

                    {/* Page controls */}
                    {!book.isCompleted && !activeSession && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updatePage(book.id, -1)}
                            disabled={book.currentPage <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-mono">
                            {book.currentPage}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updatePage(book.id, 1)}
                            disabled={book.currentPage >= book.totalPages}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pl-6">
                    {!book.isCompleted && (
                      <Button
                        className="w-full gap-2"
                        variant={
                          activeSession?.bookId === book.id
                            ? "destructive"
                            : "default"
                        }
                        onClick={() => startReading(book)}
                        disabled={
                          activeSession !== null &&
                          activeSession.bookId !== book.id
                        }
                      >
                        {activeSession?.bookId === book.id ? (
                          <>
                            <Pause className="h-4 w-4" />
                            Čitanje u toku...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Počni čitanje
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingTracker;
