import { redirect } from "next/navigation";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return new Response("STRAVA_CLIENT_ID not configured", { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/strava/callback`;
  const scope = "read,activity:read_all,profile:read_all";

  const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=${encodeURIComponent(scope)}`;

  redirect(url);
}
