import { supabase } from "./supabaseClient.js";
import { getUserContext } from "./role.js";

(async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }

  const ctx = await getUserContext();

  // Show role badge
  const roleEl = document.getElementById("userRole");
  if (roleEl) {
    roleEl.textContent = ctx.isSuperAdmin ? "Super Admin" : "Admin";
  }

  // Super admin only cards
  document.querySelectorAll(".super-only").forEach(el => {
    el.hidden = !ctx.isSuperAdmin;
  });
})();

// Navigation (NO inline logic elsewhere)
document.addEventListener("click", e => {
  const target = e.target.closest("[data-go]");
  if (!target) return;
  window.location.href = target.dataset.go;
});

window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};
