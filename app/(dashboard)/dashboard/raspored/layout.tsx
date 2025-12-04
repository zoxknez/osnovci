import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raspored | Osnovci",
  description: "Tvoj školski raspored časova po danima u nedelji",
};

export default function RasporedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
