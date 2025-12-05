/**
 * Parental Dashboard Page
 * Analytics dashboard for guardians to monitor student progress
 */

import { redirect } from "next/navigation";
import { SectionErrorBoundary } from "@/components/error-boundary";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { ParentalAnalyticsWrapper } from "./parental-analytics-wrapper";
import { ParentalDashboardEnhanced } from "./parental-dashboard-enhanced";
import { StudentSelector } from "./student-selector";

// Type for guardian link with student
interface GuardianLink {
  studentId: string;
  isActive: boolean;
  student: {
    id: string;
    name: string;
    user: {
      id: string;
      email: string | null;
    };
  };
}

export const metadata = {
  title: "Roditeljski Dashboard - Osnovci",
  description: "Analitika napretka učenika",
};

export default async function ParentalDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/prijava");
  }

  // Get guardian data with linked students
  const guardian = await prisma.guardian.findUnique({
    where: { userId: session.user.id },
    include: {
      links: {
        where: { isActive: true },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!guardian) {
    redirect("/dashboard");
  }

  if (guardian.links.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Roditeljski Dashboard</h1>
          <p className="text-muted-foreground">
            Nemate povezanih učenika. Molimo vas da povežete vašeg učenika
            koristeći kôd za povezivanje.
          </p>
        </div>
      </div>
    );
  }

  // Get selected student or default to first linked student
  const selectedStudentId =
    params.studentId || guardian.links[0]?.studentId || "";
  const selectedLink = (guardian.links as GuardianLink[]).find(
    (link) => link.studentId === selectedStudentId,
  );

  if (!selectedLink && guardian.links[0]) {
    redirect(`/dashboard/roditelj?studentId=${guardian.links[0].studentId}`);
  }

  if (!selectedLink) {
    return <div>Učenik nije pronađen</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roditeljski Dashboard</h1>
          <p className="text-muted-foreground">
            Praćenje napretka učenika {selectedLink.student.name}
          </p>
        </div>

        {guardian.links.length > 1 && (
          <StudentSelector
            links={guardian.links as GuardianLink[]}
            selectedStudentId={selectedStudentId}
          />
        )}
      </div>

      {/* Enhanced Dashboard with Alerts and Messaging */}
      <SectionErrorBoundary sectionName="Dashboard">
        <ParentalDashboardEnhanced
          studentId={selectedStudentId}
          guardianId={guardian.id}
          currentUserId={session.user.id}
          studentName={selectedLink.student.name}
        />
      </SectionErrorBoundary>

      {/* Analytics */}
      <SectionErrorBoundary sectionName="Analitika">
        <ParentalAnalyticsWrapper
          studentId={selectedStudentId}
          studentName={selectedLink.student.name}
          guardianId={guardian.id}
        />
      </SectionErrorBoundary>
    </div>
  );
}
