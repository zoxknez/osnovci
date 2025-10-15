// API route za demo instant login
import { NextResponse } from "next/server";

// Lista demo naloga
const DEMO_ACCOUNTS = Array.from({ length: 20 }, (_, i) => ({
  email: `demo${i + 1}@osnovci.rs`,
  password: "demo123",
}));

export async function GET() {
  try {
    // Random odaberi jedan demo nalog
    const randomIndex = Math.floor(Math.random() * DEMO_ACCOUNTS.length);
    const demoAccount = DEMO_ACCOUNTS[randomIndex];

    return NextResponse.json({
      success: true,
      email: demoAccount.email,
      password: demoAccount.password,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Greška pri dodeli demo naloga" },
      { status: 500 },
    );
  }
}
