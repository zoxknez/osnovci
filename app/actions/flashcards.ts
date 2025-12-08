"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

// Schemas
const createDeckSchema = z.object({
  title: z.string().min(1, "Naslov je obavezan"),
  subjectId: z.string().min(1, "Predmet je obavezan"),
  color: z.string().optional(),
});

const createCardSchema = z.object({
  front: z.string().min(1, "Pitanje je obavezno"),
  back: z.string().min(1, "Odgovor je obavezan"),
});

type ActionResponse<T = any> = {
  data?: T;
  error?: string;
};

async function getStudent() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Niste prijavljeni");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
  });

  if (!student) {
    throw new Error("Korisnik nije učenik");
  }

  return student;
}

export async function getDecksAction(): Promise<ActionResponse> {
  try {
    const student = await getStudent();

    const decks = await prisma.flashcardDeck.findMany({
      where: { studentId: student.id },
      include: {
        subject: {
          select: { name: true, icon: true, color: true },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { data: decks };
  } catch (error) {
    console.error("Error getting decks:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Greška pri učitavanju špilova",
    };
  }
}

export async function createDeckAction(
  data: z.infer<typeof createDeckSchema>,
): Promise<ActionResponse> {
  try {
    const student = await getStudent();
    const validated = createDeckSchema.parse(data);

    const deck = await prisma.flashcardDeck.create({
      data: {
        studentId: student.id,
        title: validated.title,
        subjectId: validated.subjectId,
        color: validated.color || "#3b82f6",
      },
    });

    revalidatePath("/dashboard/pernica");
    return { data: deck };
  } catch (error) {
    console.error("Error creating deck:", error);
    return {
      error:
        error instanceof Error ? error.message : "Greška pri kreiranju špila",
    };
  }
}

export async function getDeckAction(id: string): Promise<ActionResponse> {
  try {
    await getStudent(); // Ensure auth

    const deck = await prisma.flashcardDeck.findUnique({
      where: { id },
      include: {
        cards: true,
        subject: {
          select: { name: true, color: true, icon: true },
        },
      },
    });

    if (!deck) {
      return { error: "Špil nije pronađen" };
    }

    return { data: deck };
  } catch (error) {
    console.error("Error getting deck:", error);
    return {
      error:
        error instanceof Error ? error.message : "Greška pri učitavanju špila",
    };
  }
}

export async function deleteDeckAction(id: string): Promise<ActionResponse> {
  try {
    const student = await getStudent();

    const deck = await prisma.flashcardDeck.findUnique({
      where: { id },
    });

    if (!deck || deck.studentId !== student.id) {
      return { error: "Nemate pristup ovom špilu" };
    }

    await prisma.flashcardDeck.delete({
      where: { id },
    });

    revalidatePath("/dashboard/pernica");
    return { data: { success: true } };
  } catch (error) {
    console.error("Error deleting deck:", error);
    return {
      error:
        error instanceof Error ? error.message : "Greška pri brisanju špila",
    };
  }
}

export async function createCardAction(
  deckId: string,
  data: z.infer<typeof createCardSchema>,
): Promise<ActionResponse> {
  try {
    const student = await getStudent();
    const validated = createCardSchema.parse(data);

    const deck = await prisma.flashcardDeck.findUnique({
      where: { id: deckId },
    });

    if (!deck || deck.studentId !== student.id) {
      return { error: "Nemate pristup ovom špilu" };
    }

    const card = await prisma.flashcard.create({
      data: {
        deckId,
        front: validated.front,
        back: validated.back,
      },
    });

    revalidatePath(`/dashboard/pernica/${deckId}`);
    return { data: card };
  } catch (error) {
    console.error("Error creating card:", error);
    return {
      error:
        error instanceof Error ? error.message : "Greška pri kreiranju kartice",
    };
  }
}
