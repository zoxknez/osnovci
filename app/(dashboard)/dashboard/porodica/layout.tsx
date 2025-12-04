import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Porodica | Osnovci",
  description: "Poveži se sa roditeljima i upravljaj porodičnim vezama",
};

export default function PorodicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
