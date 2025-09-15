import { NextResponse } from "next/server";

const TARGET =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "proxy_error" },
      { status: 500 }
    );
  }
}
