import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ocene | Osnovci",
  description:
    "Pregled svih ocena po predmetima sa statistikama i analizom napretka",
};

export default function OceneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
