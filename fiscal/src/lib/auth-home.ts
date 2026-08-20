export type AppRole = "admin" | "consulta" | "superadmin";

export function postLoginPath(role: AppRole | string): string {
  return role === "superadmin" ? "/escritorio/empresas" : "/dashboard";
}

export function isOfficePath(pathname: string): boolean {
  return pathname === "/escritorio" || pathname.startsWith("/escritorio/");
}

export function isFiscalPath(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/" || isOfficePath(pathname)) return false;
  if (pathname.startsWith("/api")) return false;
  return true;
}
