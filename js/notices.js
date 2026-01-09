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
/* ================= NOTICE WIZARD LOGIC ================= */

// Wizard elements
const wizard = document.getElementById("wizard");
const steps = [...document.querySelectorAll(".wizard-step")];

// Wizard state
const state = {
  notice_group: null,
  notice_action: null,
  effective_date: null,
  reason_code: null,
  publish_at: null,
  supersedes_id: null
};

// Allowed actions per group (LOCKED)
const ACTIONS = {
  class_status: ["open", "closed", "rescheduled"],
  examination: ["registration_open", "registration_closed", "exam_date_announced"],
  meeting: ["guardian_meeting", "instructor_meeting"],
  general: ["holiday", "seminar", "important_info", "correction"]
};

// Show step helper
function showStep(stepNumber) {
  steps.forEach(s => s.classList.add("hidden"));
  const step = document.querySelector(`.wizard-step[data-step="${stepNumber}"]`);
  if (step) step.classList.remove("hidden");

  if (stepNumber === 6) renderPreview();
}

// Step 1: notice group selection
document.querySelectorAll("[data-group]").forEach(btn => {
  btn.addEventListener("click", () => {
    state.notice_group = btn.dataset.group;
    setActive(btn);
    loadActions();
    showStep(2);
  });
});

// Step 2: load actions dynamically
function loadActions() {
  const actionsBox = document.getElementById("actions");
  actionsBox.innerHTML = "";

  ACTIONS[state.notice_group].forEach(action => {
    const b = document.createElement("button");
    b.textContent = action.replace(/_/g, " ");
    b.addEventListener("click", () => {
      state.notice_action = action;
      setActive(b);
      showStep(3);
    });
    actionsBox.appendChild(b);
  });
}

// Step 3: effective date
document.getElementById("effectiveDate").addEventListener("change", e => {
  state.effective_date = e.target.value;
  showStep(4);
});

// Step 4: reason (optional)
document.querySelectorAll("[data-reason]").forEach(btn => {
  btn.addEventListener("click", () => {
    state.reason_code = btn.dataset.reason || null;
    setActive(btn);
    showStep(5);
  });
});

// Step 5: publish mode
document.querySelectorAll('input[name="publishMode"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const dt = document.getElementById("publishAt");
    if (radio.value === "later") {
      dt.classList.remove("hidden");
      state.publish_at = null;
    } else {
      dt.classList.add("hidden");
      state.publish_at = new Date().toISOString();
      showStep(6);
    }
  });
});

// Scheduled publish datetime
document.getElementById("publishAt").addEventListener("change", e => {
  state.publish_at = new Date(e.target.value).toISOString();
  showStep(6);
});

// Step 6: preview
function renderPreview() {
  const preview = document.getElementById("preview");
  preview.innerHTML = `
    <strong>Official Notice (Preview)</strong><br><br>
    ${state.notice_group.replace(/_/g, " ")} – ${state.notice_action.replace(/_/g, " ")}<br>
    Effective date: ${state.effective_date}<br>
    ${state.reason_code ? "Reason: " + state.reason_code : ""}
  `;
}

// Publish notice
document.getElementById("confirmPublish").addEventListener("click", async () => {
  if (!state.publish_at) state.publish_at = new Date().toISOString();

  const { error } = await supabase.from("notices").insert({
    notice_group: state.notice_group,
    notice_action: state.notice_action,
    effective_date: state.effective_date,
    reason_code: state.reason_code,
    publish_at: state.publish_at,
    supersedes_id: state.supersedes_id
  });

  if (error) {
    alert("Publish failed. Check console.");
    console.error(error);
    return;
  }

  alert("Notice published successfully.");
  window.location.reload();
});

// Cancel wizard
document.getElementById("cancelWizard").addEventListener("click", () => {
  wizard.classList.add("hidden");
});

// Active button helper
function setActive(btn) {
  btn.parentElement.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}


