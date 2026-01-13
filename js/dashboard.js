import { supabase } from "./supabaseClient.js";
import { getUserContext } from "./role.js";

/* ================= INIT ================= */
(async () => {
  // Auth guard
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }

  // Role context
  const ctx = await getUserContext();

  // Show role label
  const roleEl = document.getElementById("userRole");
  if (roleEl) {
    roleEl.textContent = ctx.isSuperAdmin ? "Super Admin" : "Admin";
  }

  // Show super-admin-only blocks
  document.querySelectorAll(".super-only").forEach(el => {
    el.style.display = ctx.isSuperAdmin ? "block" : "none";
  });
})();

/* ================= NAV HELPERS ================= */
window.goTo = function (page) {
  window.location.href = page;
};

window.logout = async function () {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};
/* ================= CARD NAVIGATION ================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-go]");
  if (!card) return;

  const page = card.getAttribute("data-go");
  if (page) {
    window.location.href = page;
  }
});
