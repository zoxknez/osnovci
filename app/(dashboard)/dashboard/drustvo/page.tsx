import { Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { StickerShop } from "@/components/features/social/sticker-shop";
import { Card, CardContent } from "@/components/ui/card";
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
  title: "Društvo | Osnovci",
  description: "Pošalji stikere drugarima iz odeljenja",
};

export default async function SocialPage() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "STUDENT") {
    redirect("/prijava");
  }

  const studentData = session.user.student;
  if (!studentData) {
    redirect("/prijava");
  }
  const studentId = studentData.id;

  // Get current student info (XP, Level, Class)
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gamification: true },
  });

  if (!student) redirect("/prijava");

  // Get stickers
  const stickers = await prisma.sticker.findMany({
    orderBy: { cost: "asc" },
  });

  // Get classmates (same school, grade, class, but not self)
  const classmates = await prisma.student.findMany({
    where: {
      school: student.school,
      grade: student.grade,
      class: student.class,
      id: { not: studentId },
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  });

  // Get leaderboard (Top 3)
  const leaderboard = await prisma.student.findMany({
    where: {
      school: student.school,
      grade: student.grade,
      class: student.class,
    },
    orderBy: {
      gamification: {
        xp: "desc",
      },
    },
    take: 3,
    select: {
      id: true,
      name: true,
      avatar: true,
      gamification: {
        select: {
          xp: true,
          level: true,
        },
      },
    },
  });

  // Get received stickers history
  const receivedStickers = await prisma.stickerLog.findMany({
    where: { receiverId: studentId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      sender: { select: { name: true } },
      sticker: true,
    },
  });

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900">
            Društvo & Stikeri 🤝
          </h1>
          <p className="text-gray-600">
            Tvoje odeljenje: {student.grade}/{student.class} •{" "}
            {classmates.length} drugara
          </p>
        </div>
        <div className="bg-yellow-50 px-6 py-3 rounded-full border border-yellow-200 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="text-xs text-yellow-700 font-bold uppercase">
              Tvoji poeni
            </p>
            <p className="text-xl font-bold text-yellow-900">
              {student.gamification?.xp || 0} XP
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Leaderboard Section */}
        <section
          aria-labelledby="leaderboard-heading"
          className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-100 shadow-sm"
        >
          <h2
            id="leaderboard-heading"
            className="text-xl font-bold text-yellow-800 mb-6 flex items-center gap-2"
          >
            🏆 Šampioni Odeljenja
          </h2>
          {/* biome-ignore lint/a11y/useSemanticElements: CSS grid with article cards requires role instead of ul/li */}
          <div
            role="list"
            aria-label="Top 3 učenika po XP poenima"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
          >
            {/* Reorder for podium: 2nd, 1st, 3rd */}
            {[leaderboard[1], leaderboard[0], leaderboard[2]]
              .filter((s): s is NonNullable<typeof s> => !!s)
              .map((s) => {
                const rank =
                  s.id === leaderboard[0]?.id
                    ? 1
                    : s.id === leaderboard[1]?.id
                      ? 2
                      : 3;
                const isFirst = rank === 1;
                const rankLabel =
                  rank === 1
                    ? "Prvo mesto"
                    : rank === 2
                      ? "Drugo mesto"
                      : "Treće mesto";

                return (
                  // biome-ignore lint/a11y/useSemanticElements: article with role for grid accessibility
                  <article
                    key={s.id}
                    role="listitem"
                    aria-label={`${rankLabel}: ${s.name} sa ${s.gamification?.xp || 0} XP poena`}
                    className={`bg-white p-4 rounded-xl shadow-sm border-b-4 flex flex-col items-center relative transition-transform hover:-translate-y-1 ${
                      isFirst
                        ? "border-yellow-400 h-48 justify-center z-10 order-2 sm:order-2"
                        : rank === 2
                          ? "border-gray-300 h-40 justify-center order-1 sm:order-1"
                          : "border-orange-300 h-36 justify-center order-3 sm:order-3"
                    }`}
                  >
                    <div
                      className={`absolute -top-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                        isFirst
                          ? "bg-yellow-500"
                          : rank === 2
                            ? "bg-gray-400"
                            : "bg-orange-400"
                      }`}
                    >
                      {rank}. Mesto
                    </div>

                    <div
                      className={`${isFirst ? "text-5xl mb-3" : "text-4xl mb-2"}`}
                    >
                      {s.avatar || "👤"}
                    </div>

                    <p
                      className={`font-bold text-gray-900 text-center ${isFirst ? "text-lg" : "text-base"}`}
                    >
                      {s.name}
                    </p>

                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        {s.gamification?.xp || 0} XP
                      </span>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>

        <h2 className="text-xl font-semibold flex items-center gap-2 pt-4">
          🛍️ Prodavnica Stikera
        </h2>

        {classmates.length === 0 ? (
          <section aria-labelledby="empty-state-heading">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8 text-center flex flex-col items-center gap-4">
                <div
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2"
                  aria-hidden="true"
                >
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h3
                    id="empty-state-heading"
                    className="text-xl font-bold text-blue-900"
                  >
                    Tvoje odeljenje je još uvek prazno!
                  </h3>
                  <p className="text-blue-700 mt-2 max-w-md mx-auto">
                    Izgleda da se tvoji drugari još nisu registrovali. Reci im
                    da prilikom registracije izaberu:
                  </p>
                  <div className="mt-4 bg-white/50 p-4 rounded-lg inline-block text-left">
                    <p className="text-sm font-semibold text-blue-800">
                      🏫 Škola: {student.school}
                    </p>
                    <p className="text-sm font-semibold text-blue-800">
                      📚 Razred: {student.grade}
                    </p>
                    <p className="text-sm font-semibold text-blue-800">
                      📝 Odeljenje: {student.class}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Kada se registruju, pojaviće se ovde i moći ćeš da im šalješ
                  stikere!
                </p>
              </CardContent>
            </Card>
          </section>
        ) : (
          <ErrorBoundary>
            <StickerShop
              stickers={stickers}
              classmates={classmates}
              currentXp={student.gamification?.xp || 0}
              currentLevel={student.gamification?.level || 1}
            />
          </ErrorBoundary>
        )}
      </div>

      {receivedStickers.length > 0 && (
        <section
          aria-labelledby="received-stickers-heading"
          className="space-y-4 pt-8 border-t"
        >
          <h2
            id="received-stickers-heading"
            className="text-xl font-semibold flex items-center gap-2"
          >
            📬 Primljeni Stikeri
          </h2>
          {/* biome-ignore lint/a11y/useSemanticElements: CSS grid with article cards requires role instead of ul/li */}
          <div
            role="list"
            aria-label="Lista primljenih stikera"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {receivedStickers.map((log) => (
              // biome-ignore lint/a11y/useSemanticElements: article with role for grid accessibility
              <article
                key={log.id}
                role="listitem"
                aria-label={`Stiker ${log.sticker.name} od ${log.sender.name}`}
                className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4"
              >
                <div className="text-4xl" aria-hidden="true">
                  {log.sticker.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{log.sticker.name}</p>
                  <p className="text-sm text-gray-500">
                    Od:{" "}
                    <span className="font-medium text-blue-600">
                      {log.sender.name}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateSafe(log.createdAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
