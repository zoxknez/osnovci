import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podešavanja | Osnovci",
  description: "Podesi svoju aplikaciju - tema, obaveštenja i privatnost",
};

export default function PodesavanjaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
