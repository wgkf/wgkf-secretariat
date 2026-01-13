import { supabase } from "./supabaseClient.js";
import { getUserContext } from "./role.js";

console.log("DASHBOARD JS LOADED");

/* ================= INIT ================= */
(async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }

  const ctx = await getUserContext();

  // Role badge
  const roleEl = document.getElementById("userRole");
  if (roleEl) {
    roleEl.textContent = ctx.isSuperAdmin ? "Super Admin" : "Admin";
  }

  // Show super-admin-only cards
  document.querySelectorAll(".super-only").forEach(el => {
    el.style.display = ctx.isSuperAdmin ? "block" : "none";
  });
})();

/* ================= NAVIGATION ================= */
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go]");
  if (!target) return;

  const page = target.dataset.go;
  console.log("NAVIGATING TO:", page);

  window.location.href = page;
});

/* ================= LOGOUT ================= */
window.logout = async function () {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};
