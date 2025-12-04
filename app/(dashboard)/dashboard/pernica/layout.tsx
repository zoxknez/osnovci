import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pernica | Osnovci",
  description: "Tvoja digitalna pernica - upravljaj predmetima i alatima",
};

export default function PernicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
