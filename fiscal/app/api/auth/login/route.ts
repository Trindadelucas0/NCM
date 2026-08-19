import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticate,
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/src/server/auth";
import { jsonError, jsonOk } from "@/src/server/http";
import { loginAllowed, loginFailed, loginSucceeded } from "@/src/server/rate-limit";

const schema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(1).max(200),
  company: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
    .transform((value) => value.toLowerCase()),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!loginAllowed(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMIT", message: "Muitas tentativas. Aguarde alguns minutos." },
        },
        { status: 429 },
      );
    }
    const body = schema.parse(await request.json());
    const user = await authenticate(body.email, body.password, body.company);
    if (!user) {
      loginFailed(ip);
      return NextResponse.json(
        { success: false, error: { code: "INVALID", message: "E-mail ou senha inválidos." } },
        { status: 401 },
      );
    }
    loginSucceeded(ip);
    const token = await createSession(user);
    const response = jsonOk({
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: "Informe e-mail, senha e empresa." } },
        { status: 400 },
      );
    }
    return jsonError(error);
  }
}
