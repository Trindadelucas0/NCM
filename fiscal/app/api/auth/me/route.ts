import { resolveCompanyScope } from "@/src/server/company-scope";
import { jsonError, jsonOk } from "@/src/server/http";
import { requireUser } from "@/src/server/tenant";

export async function GET() {
  try {
    const user = await requireUser();
    const scope = resolveCompanyScope(user);
    return jsonOk({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: scope?.companyId ?? null,
      companyName: scope?.companyName ?? (user.role === "superadmin" ? "Escritório" : null),
      fromOffice: scope?.fromOffice ?? false,
      canWrite: scope ? scope.fromOffice || user.role === "admin" : false,
    });
  } catch (error) {
    return jsonError(error);
  }
}
