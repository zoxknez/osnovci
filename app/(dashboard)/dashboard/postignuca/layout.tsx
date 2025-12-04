import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Postignuća | Osnovci",
  description: "Tvoja postignuća, bedževi i nagrade za učenje",
};

export default function PostignucaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
