import { Prisma } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "@/src/server/auth";
import { withTenant } from "@/src/server/db";
import { jsonError, jsonOk } from "@/src/server/http";
import { HttpError, requireAdmin, requireUser } from "@/src/server/tenant";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(180),
  password: z.string().min(8).max(200),
  role: z.enum(["admin", "consulta"]),
});

export async function GET() {
  try {
    const user = await requireUser();
    requireAdmin(user);
    const users = await withTenant(user.companyId, (db) =>
      db.user.findMany({
        where: { companyId: user.companyId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      }),
    );
    return jsonOk({ users });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser();
    requireAdmin(actor);
    const body = createSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    const passwordHash = await hashPassword(body.password);
    const created = await withTenant(actor.companyId, async (db) => {
      const duplicate = await db.user.findFirst({
        where: { companyId: actor.companyId, email },
        select: { id: true },
      });
      if (duplicate) {
        throw new HttpError(409, "CONFLICT", "Já existe um usuário com este e-mail nesta empresa.");
      }
      return db.user.create({
        data: {
          companyId: actor.companyId,
          email,
          passwordHash,
          name: body.name.trim(),
          role: body.role,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
    });
    return jsonOk({ user: created }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(new HttpError(409, "CONFLICT", "Já existe um usuário com este e-mail nesta empresa."));
    }
    return jsonError(error);
  }
}
