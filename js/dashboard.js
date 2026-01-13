import { getUserContext } from "./role.js";
import { getUserContext } from "./role.js";

const ctx = await getUserContext();

document.getElementById("userRole").textContent =
  ctx.isSuperAdmin ? "Super Admin" : "Admin";

/* Show super-admin-only blocks */
document.querySelectorAll(".super-only").forEach(el => {
  el.style.display = ctx.isSuperAdmin ? "block" : "none";
});

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://hnccoqttbsrkgiqhzvsf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2NvcXR0YnNya2dpcWh6dnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDczMjEsImV4cCI6MjA4MzQ4MzMyMX0.ObeLI4w7sZutjUQvP8HK_cxVPngpgfx8gJIzQutdTio"
);

// Guard: redirect if not logged in
(async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  }
})();

window.goTo = function (page) {
  window.location.href = page;
};

window.logout = async function () {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};
