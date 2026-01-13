import { supabase } from "./supabaseClient.js";
import { getUserContext } from "./role.js";

const ctx = await getUserContext();

/* ================= AUTH GUARD ================= */
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  console.log("SUPABASE SESSION:", session);
  console.log("SUPABASE ROLE:", session?.user?.role);

  if (!session) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
    throw new Error("Not authenticated");
  }

  return session;
}


/* ================= ELEMENTS ================= */
const textArea = document.getElementById("announcementText");
const charCount = document.getElementById("charCount");
const publishBtn = document.getElementById("publishAnnouncement");
const list = document.getElementById("announcementList");

const expiryCheckbox = document.getElementById("setExpiry");
const expiryInput = document.getElementById("expiryTime");

/* ================= CHAR COUNTER ================= */
textArea.addEventListener("input", () => {
  charCount.textContent = `${textArea.value.length} / 180`;
});

/* ================= EXPIRY TOGGLE ================= */
const expiryBox = document.getElementById("expiryBox");

expiryCheckbox.addEventListener("change", () => {
  expiryBox.classList.toggle("hidden", !expiryCheckbox.checked);
});

document.getElementById("saveDraft").onclick = async () => {
  const content = textArea.value.trim();
  if (!content) return alert("Content required");

 const { data: { session } } = await supabase.auth.getSession();

await supabase.from("announcements").insert({
  content,
  status: "pending",          // or "draft" in the other case
  is_active: false,
  created_by: session.user.id,
  expires_at: expiryInput.value
    ? new Date(expiryInput.value).toISOString()
    : null
});


  loadAnnouncements();
};
document.getElementById("sendForApproval").onclick = async () => {
  const content = textArea.value.trim();
  if (!content) return alert("Content required");

  const { data: { session } } = await supabase.auth.getSession();

await supabase.from("announcements").insert({
  content,
  status: "pending",          // or "draft" in the other case
  is_active: false,
  created_by: session.user.id,
  expires_at: expiryInput.value
    ? new Date(expiryInput.value).toISOString()
    : null
});


  loadAnnouncements();
};

/* ================= LOAD ================= */
async function loadAnnouncements() {

  list.innerHTML = "<li class='muted'>Loading announcements…</li>";

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .in("status", ["draft", "pending"])
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = "<li class='muted'>Error loading announcements</li>";
    console.error(error);
    return;
  }

  if (!data.length) {
    list.innerHTML = "<li class='muted'>No active announcements</li>";
    return;
  }

  list.innerHTML = "";

  data.forEach(a => {
    const li = document.createElement("li");

    /* Content block */
    const content = document.createElement("div");
    content.className = "content";
    content.textContent = a.content;

    /* Meta */
    const meta = document.createElement("small");
    const created = new Date(a.created_at).toLocaleDateString();
    meta.textContent = a.expires_at
      ? `Published ${created} • Expires ${new Date(a.expires_at).toLocaleString()}`
      : `Published ${created}`;

    content.appendChild(meta);

    

   li.append(content);
    list.appendChild(li);
  });
}


/* ================= INIT ================= */
loadAnnouncements();
