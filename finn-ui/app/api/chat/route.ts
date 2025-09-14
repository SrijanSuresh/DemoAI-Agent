import { NextResponse } from "next/server";

const TARGET = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const r = await fetch(`${TARGET}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body.message }),
    });
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    let errorMsg = "proxy_error";
    if (e && typeof e === "object" && "message" in e) {
      errorMsg = (e as Error).message;
    } else if (typeof e === "string") {
      errorMsg = e;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
