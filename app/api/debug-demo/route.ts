import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAuthSession, isDemoMode, getDemoSession } from "@/lib/auth/demo-mode";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      environment: {
        DEMO_MODE: process.env.DEMO_MODE,
        NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
        NODE_ENV: process.env.NODE_ENV,
      },
      demoModeCheck: isDemoMode(),
      demoSession: getDemoSession(),
      realAuth: null as any,
      authSession: null as any,
      userInDatabase: null as any,
    };

    // Check real auth
    const realAuthResult = await auth();
    debug.realAuth = realAuthResult?.user || null;

    // Check getAuthSession helper
    const authSessionResult = await getAuthSession(auth);
    debug.authSession = authSessionResult?.user || null;

    // Check if user exists in database
    if (authSessionResult?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: authSessionResult.user.id },
        select: { id: true, email: true, role: true },
      });
      debug.userInDatabase = user;
    }

    return NextResponse.json(debug, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
