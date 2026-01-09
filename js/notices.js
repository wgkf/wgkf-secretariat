import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_PUBLIC_ANON_KEY"
);

// Session guard
(async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  } else {
    loadNotices();
  }
})();

async function loadNotices() {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const container = document.getElementById("noticeList");
  container.innerHTML = "";

  if (error || !data.length) {
    container.innerHTML = "<p class='muted'>No notices found.</p>";
    return;
  }

  data.forEach(n => {
    const div = document.createElement("div");
    div.className = "notice-card";

    const status = n.archived_at
      ? "Archived"
      : new Date(n.publish_at) > new Date()
        ? "Scheduled"
        : "Active";

    div.innerHTML = `
      <small>Status: ${status}</small>
      <strong>${n.notice_group.replace("_", " ")} – ${n.notice_action.replace("_", " ")}</strong>
      <small>Effective date: ${n.effective_date}</small>
      ${status !== "Archived" ? `<button onclick="issueCorrection('${n.id}')">Issue Correction</button>` : ""}
    `;

    container.appendChild(div);
  });
}

window.startNewNotice = function () {
  alert("Notice creation wizard will open next (Phase 6D).");
};

window.issueCorrection = function (id) {
  alert("Correction flow will open for notice ID: " + id);
};

window.goBack = function () {
  window.location.href = "dashboard.html";
};
