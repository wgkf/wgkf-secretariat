import { supabase } from "./supabaseClient.js";

export async function getUserContext() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "index.html";
    throw new Error("Not authenticated");
  }

  const role = session.user.app_metadata?.role || "admin";

  return {
    session,
    role,
    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin"
  };
}
