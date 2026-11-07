import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFoundResponse(message = "Record not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequestResponse(error: string | ZodError) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  return NextResponse.json({ error }, { status: 400 });
}

export function serverErrorResponse(error?: unknown) {
  console.error("API Server Error:", error);
  return NextResponse.json(
    { error: "An unexpected internal server error occurred" },
    { status: 500 }
  );
}
