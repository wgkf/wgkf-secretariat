import { supabase } from "./supabaseClient.js";
import { getUserContext } from "./role.js";

/* ================= AUTH ================= */
const ctx = await getUserContext();

if (!ctx.isSuperAdmin) {
  alert("Access denied");
  window.location.href = "dashboard.html";
  throw new Error("Not super admin");
}

/* ================= PARAM ================= */
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  alert("Invalid request");
  window.location.href = "dashboard.html";
}

/* ================= ELEMENTS ================= */
const contentEl = document.getElementById("content");
const expiresEl = document.getElementById("expiresAt");
const charCount = document.getElementById("charCount");
const publishBtn = document.getElementById("publishBtn");

/* ================= LOAD ================= */
const { data, error } = await supabase
  .from("announcements")
  .select("*")
  .eq("id", id)
  .single();

if (error || !data) {
  alert("Failed to load announcement");
  window.location.href = "dashboard.html";
}

contentEl.value = data.content;
charCount.textContent = `${data.content.length} / 180`;

if (data.expires_at) {
  expiresEl.value = data.expires_at.slice(0, 16);
}

/* ================= COUNTER ================= */
contentEl.addEventListener("input", () => {
  charCount.textContent = `${contentEl.value.length} / 180`;
});

/* ================= PUBLISH ================= */
publishBtn.onclick = async () => {
  const content = contentEl.value.trim();
  if (!content) return alert("Content required");

  publishBtn.disabled = true;

  const { error } = await supabase
    .from("announcements")
    .update({
      content,
      expires_at: expiresEl.value
        ? new Date(expiresEl.value).toISOString()
        : null,
      status: "published",
      is_active: true
    })
    .eq("id", id);

  publishBtn.disabled = false;

  if (error) {
    alert(error.message);
    return;
  }

  alert("Announcement published");
  window.location.href = "announcements-approval.html";
};

window.goBack = () => {
  window.history.back();
};
