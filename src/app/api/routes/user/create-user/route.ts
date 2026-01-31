import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log(body)

  return NextResponse.json({
    method: "POST",
    message: "Created",
    body,
  });
}
