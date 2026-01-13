/* ================= IMPORTS (TOP ONLY) ================= */
import { getUserContext } from "./role.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE CLIENT ================= */
const supabase = createClient(
  "https://hnccoqttbsrkgiqhzvsf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2NvcXR0YnNya2dpcWh6dnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDczMjEsImV4cCI6MjA4MzQ4MzMyMX0.ObeLI4w7sZutjUQvP8HK_cxVPngpgfx8gJIzQutdTio"
);

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

  // Super-admin-only UI
  document.querySelectorAll(".super-only").forEach(el => {
    el.style.display = ctx.isSuperAdmin ? "block" : "none";
  });
})();

/* ================= GLOBAL NAV HELPERS ================= */
window.goTo = function (page) {
  window.location.href = page;
};

window.logout = async function () {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};
