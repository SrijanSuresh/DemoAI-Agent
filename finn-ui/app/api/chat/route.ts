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

    const raw = await r.text();

    // Try to parse backend JSON safely
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Backend sent HTML or non-JSON; wrap into JSON error
      return NextResponse.json(
        {
          error: "upstream_non_json",
          status: r.status,
          details: raw.slice(0, 500), // include a snippet to debug
        },
        { status: r.status || 502 }
      );
    }

    return NextResponse.json(parsed, { status: r.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
