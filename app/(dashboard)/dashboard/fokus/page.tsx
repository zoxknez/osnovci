import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { FocusTimer } from "@/components/features/focus/focus-timer";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

// Utility za sigurno formatiranje datuma
function formatDateSafe(date: Date | string | null | undefined): string {
  if (!date) return "Nepoznat datum";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Nepoznat datum";
  return d.toLocaleDateString("sr-RS");
}

export const metadata: Metadata = {
  title: "Fokus Mod | Osnovci",
  description: "Povećaj produktivnost uz fokus tajmer",
};

export default async function FocusPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "STUDENT") {
    redirect("/prijava");
  }

  const studentData = session.user.student;
  if (!studentData) {
    redirect("/prijava");
  }

  const subjects = await prisma.subject.findMany({
    where: {
      students: {
        some: {
          studentId: studentData.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      icon: true,
    },
  });

  // Also get recent sessions for history
  const recentSessions = await prisma.focusSession.findMany({
    where: {
      studentId: studentData.id,
      status: "COMPLETED",
    },
    orderBy: { startTime: "desc" },
    take: 5,
    include: { subject: true },
  });

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Fokus Mod 🧠</h1>
        <p className="text-gray-600">
          Isključi ometanja i fokusiraj se na učenje.
        </p>
      </div>

      <ErrorBoundary>
        <FocusTimer subjects={subjects} />
      </ErrorBoundary>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {Math.round(
              (recentSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0) /
                60) *
                10,
            ) / 10}
            h
          </div>
          <div className="text-xs text-blue-600 uppercase font-bold tracking-wider">
            Ove nedelje
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {recentSessions.length}
          </div>
          <div className="text-xs text-purple-600 uppercase font-bold tracking-wider">
            Sesija
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {recentSessions.reduce((acc, s) => acc + s.xpEarned, 0)}
          </div>
          <div className="text-xs text-yellow-600 uppercase font-bold tracking-wider">
            XP Osvojeno
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
          <div className="text-2xl font-bold text-green-700">
            {recentSessions.length > 0
              ? Math.round(
                  recentSessions.reduce(
                    (acc, s) => acc + (s.duration ?? 0),
                    0,
                  ) / recentSessions.length,
                )
              : 0}
            m
          </div>
          <div className="text-xs text-green-600 uppercase font-bold tracking-wider">
            Prosek
          </div>
        </div>
      </div>

      {recentSessions.length > 0 && (
        <section aria-labelledby="recent-sessions-heading" className="mt-12">
          <h2
            id="recent-sessions-heading"
            className="text-xl font-semibold mb-4"
          >
            Nedavne sesije
          </h2>
          {/* biome-ignore lint/a11y/useSemanticElements: CSS grid with article cards */}
          <div
            role="list"
            aria-label="Lista nedavnih fokus sesija"
            className="grid gap-4"
          >
            {recentSessions.map((session) => (
              // biome-ignore lint/a11y/useSemanticElements: article with role for grid
              <article
                key={session.id}
                role="listitem"
                aria-label={`${session.subject?.name || "Nepoznat predmet"} - ${session.duration} minuta`}
                className="bg-white p-4 rounded-lg border flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl" aria-hidden="true">
                    {session.subject?.icon || "📚"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {session.subject?.name || "Nepoznat predmet"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateSafe(session.startTime)} • {session.duration}{" "}
                      min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-yellow-600 font-bold">
                  <span>+{session.xpEarned} XP</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
