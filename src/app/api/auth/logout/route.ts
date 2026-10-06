import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = cookies();
  cookieStore.set("gym_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.delete("gym_session");

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST() {
  const cookieStore = cookies();
  cookieStore.set("gym_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.delete("gym_session");

  return NextResponse.json({ success: true });
}
