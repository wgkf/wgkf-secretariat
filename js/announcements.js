import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE ================= */
const supabase = createClient(
  "https://hnccoqttbsrkgiqhzvsf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2NvcXR0YnNya2dpcWh6dnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDczMjEsImV4cCI6MjA4MzQ4MzMyMX0.ObeLI4w7sZutjUQvP8HK_cxVPngpgfx8gJIzQutdTio"
);

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

/* ================= PUBLISH ================= */
publishBtn.addEventListener("click", async () => {

  const content = textArea.value.trim();
  if (!content) {
    alert("Announcement cannot be empty.");
    return;
  }

  publishBtn.disabled = true;

  const payload = {
    content,
    is_active: true
  };

  if (expiryCheckbox.checked && expiryInput.value) {
    payload.expires_at = new Date(expiryInput.value).toISOString();
  }

  const { error } = await supabase
    .from("announcements")
    .insert(payload);

  publishBtn.disabled = false;

  if (error) {
    alert("Failed to publish announcement.");
    console.error(error);
    return;
  }

  // Reset UI
  textArea.value = "";
  expiryCheckbox.checked = false;
  expiryBox.classList.add("hidden");
  expiryInput.value = "";
  charCount.textContent = "0 / 180";

  loadAnnouncements();
});

/* ================= LOAD ================= */
async function loadAnnouncements() {

  list.innerHTML = "<li class='muted'>Loading announcements…</li>";

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
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

    /* Action */
    const deactivateBtn = document.createElement("button");
    deactivateBtn.textContent = "Deactivate";
    deactivateBtn.onclick = () => deactivateAnnouncement(a.id);

    li.append(content, deactivateBtn);
    list.appendChild(li);
  });
}

/* ================= DEACTIVATE ================= */
async function deactivateAnnouncement(id) {

  if (!confirm("Deactivate this announcement?")) return;

  const { error } = await supabase
    .from("announcements")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
  alert(error.message);
  console.error("FULL ERROR OBJECT:", error);
  return;
}


  loadAnnouncements();
}

/* ================= INIT ================= */
loadAnnouncements();
