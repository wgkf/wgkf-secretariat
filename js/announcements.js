import { supabase } from "./supabaseClient.js";

/* ================= ELEMENTS ================= */
const textArea = document.getElementById("announcementText");
const charCount = document.getElementById("charCount");
const list = document.getElementById("announcementList");

const expiryCheckbox = document.getElementById("setExpiry");
const expiryInput = document.getElementById("expiryTime");
const expiryBox = document.getElementById("expiryBox");

const saveDraftBtn = document.getElementById("saveDraft");
const sendForApprovalBtn = document.getElementById("sendForApproval");

/* ================= BASIC GUARD ================= */
if (!textArea || !saveDraftBtn || !sendForApprovalBtn) {
  console.error("Announcement form elements missing");
  throw new Error("UI not loaded correctly");
}

/* ================= CHAR COUNTER ================= */
textArea.addEventListener("input", () => {
  charCount.textContent = `${textArea.value.length} / 180`;
});

/* ================= EXPIRY TOGGLE ================= */
expiryCheckbox.addEventListener("change", () => {
  expiryBox.classList.toggle("hidden", !expiryCheckbox.checked);
});

/* ================= HELPERS ================= */
async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
    throw new Error("No session");
  }
  return data.session.user;
}

function getExpiry() {
  return expiryCheckbox.checked && expiryInput.value
    ? new Date(expiryInput.value).toISOString()
    : null;
}

/* ================= SAVE DRAFT ================= */
saveDraftBtn.onclick = async () => {
  const content = textArea.value.trim();
  if (!content) {
    alert("Announcement content is required.");
    return;
  }

  const user = await getSessionUser();

  const { error } = await supabase.from("announcements").insert({
    content,
    status: "draft",
    is_active: false,
    created_by: user.id,
    expires_at: getExpiry()
  });

  if (error) {
    console.error(error);
    alert("Failed to save draft.");
    return;
  }

  alert("Draft saved.");
  loadAnnouncements();
};

/* ================= SEND FOR APPROVAL ================= */
sendForApprovalBtn.onclick = async () => {
  const content = textArea.value.trim();
  if (!content) {
    alert("Announcement content is required.");
    return;
  }

  const user = await getSessionUser();

  const { error } = await supabase.from("announcements").insert({
    content,
    status: "pending",
    is_active: false,
    created_by: user.id,
    expires_at: getExpiry()
  });

  if (error) {
    console.error(error);
    alert("Failed to send for approval.");
    return;
  }

  alert("Sent for approval.");
  loadAnnouncements();
};

/* ================= LOAD ADMIN DRAFTS ================= */
async function loadAnnouncements() {
  list.innerHTML = "<li class='muted'>Loading…</li>";

  const user = await getSessionUser();

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("created_by", user.id)
    .in("status", ["draft", "pending"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    list.innerHTML = "<li class='muted'>Failed to load drafts.</li>";
    return;
  }

  if (!data.length) {
    list.innerHTML = "<li class='muted'>No drafts yet.</li>";
    return;
  }

  list.innerHTML = "";
  data.forEach(a => {
    const li = document.createElement("li");
    li.textContent = `[${a.status.toUpperCase()}] ${a.content}`;
    list.appendChild(li);
  });
}

/* ================= INIT ================= */
loadAnnouncements();
