import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }

  console.error(error);
  const message = error instanceof Error ? error.message : "Something went wrong";
  return NextResponse.json({ success: false, message }, { status: 500 });
}
