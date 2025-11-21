import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { syncHomeworkAction } from "@/app/actions/homework";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, entity, data } = body;

    if (!action || !entity || !data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    log.info("Sync request received", { action, entity });

    let result;

    if (entity === "homework") {
      const syncType = action.toUpperCase() as "CREATE" | "UPDATE" | "DELETE";
      result = await syncHomeworkAction({
        type: syncType,
        data: data,
      });
    } else if (entity === "note") {
      // Notes are just updates to homework
      result = await syncHomeworkAction({
        type: "UPDATE",
        data: {
          id: data.homeworkId,
          notes: data.notes,
        },
      });
    } else {
      return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
    }

    if (result.error) {
      log.error("Sync failed", { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    log.error("Sync API error", { error });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
