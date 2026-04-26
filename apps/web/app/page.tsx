import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server-rsc";

export default async function HomePage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
