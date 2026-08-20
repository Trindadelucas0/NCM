import { redirect } from "next/navigation";
import { postLoginPath } from "@/src/lib/auth-home";
import { getCurrentUser } from "@/src/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(postLoginPath(user.role));
}
