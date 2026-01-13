import { supabase } from "./supabaseClient.js";
import { getUserContext } from "./role.js";

const ctx = await getUserContext();

if (!ctx.isSuperAdmin) {
  alert("Access denied");
  window.location.href = "dashboard.html";
  throw new Error("Not super admin");
}

async function loadPending() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Failed to load pending announcements");
    return;
  }

  renderAnnouncements(data);
}

function renderAnnouncements(items) {
  const container = document.getElementById("approvalList");
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = "<p class='muted'>No pending announcements.</p>";
    return;
  }

  items.forEach(a => {
    const card = document.createElement("div");
    card.className = "approval-card";

    card.innerHTML = `
      <h3>${a.content.slice(0, 40)}${a.content.length > 40 ? "…" : ""}</h3>
      <p class="meta">
        Submitted on ${new Date(a.created_at).toLocaleDateString()}
        ${a.expires_at ? `• Expires ${new Date(a.expires_at).toLocaleString()}` : ""}
      </p>
      <div class="content-box">${a.content}</div>

      <div class="actions">
        <button onclick="approve('${a.id}')">Approve & Publish</button>
        <button onclick="editAndPublish('${a.id}')">Edit & Publish</button>
        <button onclick="sendBack('${a.id}')">Send Back</button>
        <button class="danger" onclick="reject('${a.id}')">Reject</button>
      </div>
    `;

    container.appendChild(card);
  });
}

window.approve = async function (id) {
  if (!confirm("Approve and publish this announcement?")) return;

  const { error } = await supabase
    .from("announcements")
    .update({
      status: "published",
      is_active: true
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadPending();
};


window.editAndPublish = function (id) {
  window.location.href = `announcements-edit.html?id=${id}&mode=publish`;
};

window.sendBack = async function (id) {
  const note = prompt("Send back with note (optional):");

  const { error } = await supabase
    .from("announcements")
    .update({
      status: "draft",
      review_note: note || null
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadPending();
};
window.reject = async function (id) {
  if (!confirm("Reject this announcement permanently?")) return;

  const note = prompt("Rejection note (optional):");

  const { error } = await supabase
    .from("announcements")
    .update({
      status: "rejected",
      review_note: note || null
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadPending();
};
loadPending();
