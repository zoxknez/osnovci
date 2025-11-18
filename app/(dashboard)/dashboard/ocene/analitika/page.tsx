import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import GradeAnalytics from "@/components/analytics/grade-analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function GradeAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;

  // Fetch user with roles
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      student: true,
      guardian: {
        include: {
          links: {
            where: { isActive: true },
            include: { student: true },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Determine student ID
  let studentId: string;
  let studentName: string = "Učenik";
  let multipleStudents = false;

  if (user.student) {
    // User is a student - show their own analytics
    studentId = user.student.id;
    studentName = user.student.name;
  } else if (user.guardian) {
    // User is a guardian - show selected student or first linked student
    const selectedLink = user.guardian.links.find(
      (link: any) => link.studentId === params.studentId
    );
    const activeLink = selectedLink || user.guardian.links[0];
    
    studentId = activeLink?.studentId || "";

    if (!studentId) {
      return (
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-4">Analitika Ocena</h1>
          <p className="text-muted-foreground">
            Nemate povezanih učenika. Povežite učenika da biste videli analitiku.
          </p>
        </div>
      );
    }

    studentName = activeLink?.student.name || "Učenik";
    multipleStudents = user.guardian.links.length > 1;
  } else {
    redirect("/dashboard");
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analitika Ocena - Trendovi</h1>
          <p className="text-muted-foreground mt-2">
            Praćenje napretka i predviđanje budućih rezultata za {studentName}
          </p>
        </div>
        
        {/* Student Selector for Guardians */}
        {multipleStudents && user.guardian && (
          <form action={`/dashboard/ocene/analitika`} method="get">
            <Select name="studentId" defaultValue={studentId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Izaberite učenika" />
              </SelectTrigger>
              <SelectContent>
                {user.guardian.links.map((link: any) => (
                  <SelectItem key={link.studentId} value={link.studentId}>
                    {link.student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        )}
      </div>

      {/* Analytics Component */}
      <GradeAnalytics studentId={studentId} />
    </div>
  );
}
