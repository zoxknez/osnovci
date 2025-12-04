import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil | Osnovci",
  description: "Tvoj profil - podesi avatar, ime i ostale informacije",
};

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
