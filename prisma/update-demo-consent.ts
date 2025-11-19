// Update demo student sa consent poljima
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Update-ujem demo student sa consent poljima...\n");

  const user = await prisma.user.findUnique({
    where: { email: "marko@demo.rs" },
    include: { student: true },
  });

  if (!user || !user.student) {
    console.log("❌ Demo nalog nije pronađen!");
    return;
  }

  await prisma.student.update({
    where: { id: user.student.id },
    data: {
      parentalConsentGiven: true,
      accountActive: true,
    },
  });

  console.log("✅ Demo student update-ovan!");
  console.log(`   Student ID: ${user.student.id}`);
  console.log(`   Parental Consent: true`);
  console.log(`   Account Active: true`);
}

main()
  .catch((e) => {
    console.error("❌ Greška:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
