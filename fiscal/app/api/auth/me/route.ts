import { jsonError, jsonOk } from "@/src/server/http";
import { requireUser } from "@/src/server/tenant";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.companyName ?? (user.role === "superadmin" ? "Escritório" : null),
    });
  } catch (error) {
    return jsonError(error);
  }
}
