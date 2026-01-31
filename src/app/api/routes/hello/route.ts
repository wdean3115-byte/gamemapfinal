import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    method: "GET",
    message: "Hello Worldsss",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  return NextResponse.json({
    method: "POST",
    message: "Created",
    body,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  return NextResponse.json({
    method: "PUT",
    message: "Updated",
    body,
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();

  return NextResponse.json({
    method: "DELETE",
    message: "Deleted",
    body,
  });
}


