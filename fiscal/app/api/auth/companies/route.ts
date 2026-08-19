import { prisma } from "@/src/server/db";
import { jsonError, jsonOk } from "@/src/server/http";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });
    return jsonOk({ companies });
  } catch (error) {
    return jsonError(error);
  }
}
