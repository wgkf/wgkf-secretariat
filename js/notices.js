import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://hnccoqttbsrkgiqhzvsf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2NvcXR0YnNya2dpcWh6dnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDczMjEsImV4cCI6MjA4MzQ4MzMyMX0.ObeLI4w7sZutjUQvP8HK_cxVPngpgfx8gJIzQutdTio"
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
  const wizard = document.getElementById("wizard");
  wizard.classList.remove("hidden");
  showStep(1);
};


window.issueCorrection = function (id) {
  alert("Correction flow will open for notice ID: " + id);
};

window.goBack = function () {
  window.location.href = "dashboard.html";
};

