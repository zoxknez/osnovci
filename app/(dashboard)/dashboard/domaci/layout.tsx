import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domaći zadaci | Osnovci",
  description:
    "Upravljaj svojim domaćim zadacima - dodaj, uredi i označi zadatke kao završene",
};

export default function DomaciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
