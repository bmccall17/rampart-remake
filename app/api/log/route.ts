import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // For now, just log to server console
    // Later this can be extended to write to a database or KV store
    console.log("LOG_EVENT", JSON.stringify(body, null, 2));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing log:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process log" },
      { status: 500 }
    );
  }
}
