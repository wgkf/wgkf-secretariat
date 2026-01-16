import { supabase } from "./supabaseClient.js";
import { getUserContext } from "./role.js";

/* ======================================================
   INITIAL CONTEXT
====================================================== */
const ctx = await getUserContext();
/* ======================================================
   FORCE VISIBILITY FOR SUPER-ADMIN SECTIONS (IMPORTANT)
====================================================== */
if (ctx.isSuperAdmin) {
  document.querySelectorAll(".super-only").forEach(el => {
    el.style.display = "block";
  });
}

/* ======================================================
   ELEMENTS
====================================================== */
const textArea = document.getElementById("announcementText");
const charCount = document.getElementById("charCount");
const list = document.getElementById("announcementList");

const expiryCheckbox = document.getElementById("setExpiry");
const expiryInput = document.getElementById("expiryTime");
const expiryBox = document.getElementById("expiryBox");

const saveDraftBtn = document.getElementById("saveDraft");
const sendForApprovalBtn = document.getElementById("sendForApproval");
const publishNowBtn = document.getElementById("publishNow");

/* ======================================================
   BASIC UI VALIDATION
====================================================== */
if (!textArea || !saveDraftBtn) {
  alert("Announcement UI failed to load.");
  throw new Error("Required elements missing");
}

/* ======================================================
   ROLE-BASED UI
====================================================== */
if (ctx.isSuperAdmin) {
  if (sendForApprovalBtn) sendForApprovalBtn.style.display = "none";
  if (publishNowBtn) publishNowBtn.classList.remove("hidden");
} else {
  if (publishNowBtn) publishNowBtn.style.display = "none";
}

/* ======================================================
   CHAR COUNTER
====================================================== */
textArea.addEventListener("input", () => {
  charCount.textContent = `${textArea.value.length} / 180`;
});

/* ======================================================
   EXPIRY TOGGLE
====================================================== */
expiryCheckbox.addEventListener("change", () => {
  expiryBox.classList.toggle("hidden", !expiryCheckbox.checked);
});

/* ======================================================
   HELPERS
====================================================== */
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

function resetForm() {
  textArea.value = "";
  charCount.textContent = "0 / 180";
  expiryCheckbox.checked = false;
  expiryBox.classList.add("hidden");
  expiryInput.value = "";
}

/* ======================================================
   SAVE DRAFT (ONE DRAFT PER USER)
====================================================== */
saveDraftBtn.onclick = async () => {
  const content = textArea.value.trim();
  if (!content) return alert("Content required");

  const user = await getSessionUser();

  const { data: draft } = await supabase
    .from("announcements")
    .select("id")
    .eq("created_by", user.id)
    .eq("status", "draft")
    .maybeSingle();

  if (draft) {
    await supabase
      .from("announcements")
      .update({
        content,
        expires_at: getExpiry()
      })
      .eq("id", draft.id);
  } else {
    await supabase.from("announcements").insert({
      content,
      status: "draft",
      is_active: false,
      created_by: user.id,
      expires_at: getExpiry()
    });
  }

  alert("✅Draft saved");
  loadMyAnnouncements();
};

/* ======================================================
   SEND FOR APPROVAL (ADMIN ONLY)
====================================================== */
if (sendForApprovalBtn) {
  sendForApprovalBtn.onclick = async () => {
    const content = textArea.value.trim();
    if (!content) return alert("❗Content required");

    const user = await getSessionUser();

    const { data } = await supabase
      .from("announcements")
      .update({
        content,
        status: "pending",
        expires_at: getExpiry()
      })
      .eq("created_by", user.id)
      .eq("status", "draft")
      .select();

    if (!data || data.length === 0) {
      await supabase.from("announcements").insert({
        content,
        status: "pending",
        is_active: false,
        created_by: user.id,
        expires_at: getExpiry()
      });
    }

    alert("✅Sent for approval");
    resetForm();
    loadMyAnnouncements();
  };
}

/* ======================================================
   PUBLISH NOW (SUPER ADMIN ONLY)
====================================================== */
if (publishNowBtn) {
  publishNowBtn.onclick = async () => {
    const content = textArea.value.trim();
    if (!content) return alert("❗Content required");

    const user = await getSessionUser();

    await supabase.from("announcements").insert({
      content,
      status: "published",
      is_active: true,
      created_by: user.id,
      expires_at: getExpiry()
    });

    alert("✅Published successfully");
    resetForm();
    loadMyAnnouncements();
  };
}

/* ======================================================
   LOAD USER ANNOUNCEMENTS (DRAFT + PENDING)
====================================================== */
async function loadMyAnnouncements() {
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
    li.innerHTML = `<strong>[${a.status.toUpperCase()}]</strong> ${a.content}`;

    const reuseBtn = document.createElement("button");
    reuseBtn.textContent = "Reuse";
    reuseBtn.onclick = () => {
      textArea.value = a.content;
      charCount.textContent = `${a.content.length} / 180`;

      if (a.expires_at) {
        expiryCheckbox.checked = true;
        expiryBox.classList.remove("hidden");
        expiryInput.value = a.expires_at.slice(0, 16);
      } else {
        expiryCheckbox.checked = false;
        expiryBox.classList.add("hidden");
        expiryInput.value = "";
      }
    };

    li.appendChild(reuseBtn);
    list.appendChild(li);
  });
}
async function loadLiveAnnouncements() {
  if (!ctx.isSuperAdmin) return;

  const container = document.getElementById("liveAnnouncementList");
  if (!container) return;

  container.innerHTML = "<li class='muted'>Loading…</li>";

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<li class='muted'>Failed to load.</li>";
    return;
  }

  if (!data.length) {
    container.innerHTML = "<li class='muted'>No active announcements.</li>";
    return;
  }

  container.innerHTML = "";

  data.forEach(a => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="content">
        ${a.content}
        <small>
          Published on ${new Date(a.created_at).toLocaleDateString()}
        </small>
      </div>
    `;

    const deactivateBtn = document.createElement("button");
    deactivateBtn.textContent = "Deactivate";
    deactivateBtn.onclick = async () => {
      if (!confirm("Deactivate this announcement?")) return;

      await supabase
        .from("announcements")
        .update({ is_active: false })
        .eq("id", a.id);

      loadLiveAnnouncements();
    };

    li.appendChild(deactivateBtn);
    container.appendChild(li);
  });
}

/* ======================================================
   INIT
====================================================== */
loadMyAnnouncements();
loadLiveAnnouncements();

