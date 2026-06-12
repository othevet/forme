import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  const clientId = process.env.STRAVA_CLIENT_ID!;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/strava/callback`;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
