import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { FocusTimer } from "@/components/features/focus/focus-timer";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fokus Mod | Osnovci",
  description: "Povećaj produktivnost uz fokus tajmer",
};

export default async function FocusPage() {
  const session = await auth();
  
  if (!session || !session.user || session.user.role !== "STUDENT") {
    redirect("/prijava");
  }

  const subjects = await prisma.subject.findMany({
    where: {
      students: {
        some: {
          studentId: session.user.student!.id
        }
      }
    },
    select: {
      id: true,
      name: true,
      icon: true
    }
  });

  // Also get recent sessions for history
  const recentSessions = await prisma.focusSession.findMany({
    where: {
      studentId: session.user.student!.id,
      status: "COMPLETED"
    },
    orderBy: { startTime: "desc" },
    take: 5,
    include: { subject: true }
  });

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Fokus Mod 🧠</h1>
        <p className="text-gray-600">Isključi ometanja i fokusiraj se na učenje.</p>
      </div>

      <FocusTimer subjects={subjects} />

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {Math.round(recentSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0) / 60 * 10) / 10}h
          </div>
          <div className="text-xs text-blue-600 uppercase font-bold tracking-wider">Ove nedelje</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {recentSessions.length}
          </div>
          <div className="text-xs text-purple-600 uppercase font-bold tracking-wider">Sesija</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {recentSessions.reduce((acc, s) => acc + s.xpEarned, 0)}
          </div>
          <div className="text-xs text-yellow-600 uppercase font-bold tracking-wider">XP Osvojeno</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
          <div className="text-2xl font-bold text-green-700">
            {recentSessions.length > 0 ? Math.round(recentSessions.reduce((acc, s) => acc + (s.duration ?? 0), 0) / recentSessions.length) : 0}m
          </div>
          <div className="text-xs text-green-600 uppercase font-bold tracking-wider">Prosek</div>
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Nedavne sesije</h2>
          <div className="grid gap-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{session.subject?.icon || "📚"}</div>
                  <div>
                    <p className="font-medium">{session.subject?.name || "Nepoznat predmet"}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.startTime).toLocaleDateString("sr-RS")} • {session.duration} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-yellow-600 font-bold">
                  <span>+{session.xpEarned} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
