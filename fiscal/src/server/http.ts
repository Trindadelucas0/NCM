import { NextResponse } from "next/server";
import { HttpError } from "@/src/server/tenant";

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  const message = error instanceof Error ? error.message : "Erro interno.";
  const safe =
    process.env.NODE_ENV === "production" ? "Não foi possível concluir a operação." : message;
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL", message: safe } },
    { status: 500 },
  );
}

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
