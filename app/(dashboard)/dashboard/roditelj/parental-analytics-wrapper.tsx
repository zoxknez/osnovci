"use client";

import dynamic from "next/dynamic";

const ParentalAnalytics = dynamic(
  () => import("@/components/reports/parental-analytics").then((mod) => mod.ParentalAnalytics),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    ),
    ssr: false,
  }
);

interface ParentalAnalyticsWrapperProps {
  studentId: string;
  studentName: string;
  guardianId: string;
}

export function ParentalAnalyticsWrapper(props: ParentalAnalyticsWrapperProps) {
  return <ParentalAnalytics {...props} />;
}
