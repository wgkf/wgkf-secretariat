import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================================================
   SUPABASE CLIENT
   ========================================================= */
const supabase = createClient(
  "https://hnccoqttbsrkgiqhzvsf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2NvcXR0YnNya2dpcWh6dnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDczMjEsImV4cCI6MjA4MzQ4MzMyMX0.ObeLI4w7sZutjUQvP8HK_cxVPngpgfx8gJIzQutdTio"
);

/* =========================================================
   ENUMS (NO MAGIC STRINGS)
   ========================================================= */
const UI_STATE = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  IDLE: "IDLE",
  WIZARD: "WIZARD",
  PUBLISHING: "PUBLISHING",
  CONFIRMED: "CONFIRMED",
  ERROR: "ERROR"
});

const WIZARD_STEP = Object.freeze({
  INIT: 0,
  GROUP: 1,
  ACTION: 2,
  DATE: 3,
  REASON: 4,
  PUBLISH_MODE: 5,
  PREVIEW: 6
});

/* =========================================================
   CANONICAL STATE (SINGLE SOURCE OF TRUTH)
   ========================================================= */
const state = {
  ui: UI_STATE.UNAUTHENTICATED,

  wizard: {
    step: WIZARD_STEP.INIT,
    notice_group: null,
    notice_action: null,
    effective_date: null,
    reason_code: null,
    publish_at: null,
    supersedes_id: null
  },

  publishing: false,
  error: null
};

/* =========================================================
   CONSTANTS
   ========================================================= */
const ACTIONS = {
  class_status: ["open", "closed", "rescheduled"],
  examination: ["registration_open", "registration_closed", "exam_date_announced"],
  meeting: ["guardian_meeting", "instructor_meeting"],
  general: ["holiday", "seminar", "important_info", "correction"]
};

/* =========================================================
   DOM REFERENCES (ASSIGNED ONCE)
   ========================================================= */
let dom = {};

/* =========================================================
   INITIALISATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindDom();
  await guardSession();
  await loadNotices();
  render();
}

/* =========================================================
   SESSION GUARD
   ========================================================= */
async function guardSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return;
  }
  state.ui = UI_STATE.IDLE;
}

/* =========================================================
   DOM BINDING (NO INLINE HANDLERS)
   ========================================================= */
function bindDom() {
  dom = {
    wizard: document.getElementById("wizard"),
    steps: [...document.querySelectorAll(".wizard-step")],
    actionsBox: document.getElementById("actions"),
    effectiveDate: document.getElementById("effectiveDate"),
    publishAt: document.getElementById("publishAt"),
    preview: document.getElementById("preview"),
    noticeList: document.getElementById("noticeList"),

    startBtn: document.getElementById("startNoticeBtn"),
    confirmBtn: document.getElementById("confirmPublish"),
    cancelBtn: document.getElementById("cancelWizard"),
    backBtn: document.getElementById("backToDashboardBtn")
  };

  dom.startBtn.addEventListener("click", startWizard);
  dom.cancelBtn.addEventListener("click", cancelWizard);
  dom.confirmBtn.addEventListener("click", publishNotice);
  dom.backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  // Step 1
  document.querySelectorAll("[data-group]").forEach(btn => {
    btn.addEventListener("click", () => selectGroup(btn.dataset.group, btn));
  });

  // Step 3
  dom.effectiveDate.addEventListener("change", e => {
    if (state.wizard.step !== WIZARD_STEP.DATE) return;
    state.wizard.effective_date = e.target.value;
    state.wizard.step = WIZARD_STEP.REASON;
    render();
  });

  // Step 4
  document.querySelectorAll("[data-reason]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.wizard.step !== WIZARD_STEP.REASON) return;
      state.wizard.reason_code = btn.dataset.reason || null;
      state.wizard.step = WIZARD_STEP.PUBLISH_MODE;
      render();
    });
  });

  // Step 5
  document.querySelectorAll('input[name="publishMode"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (state.wizard.step !== WIZARD_STEP.PUBLISH_MODE) return;

      if (radio.value === "later") {
        dom.publishAt.classList.remove("hidden");
        state.wizard.publish_at = null;
      } else {
        dom.publishAt.classList.add("hidden");
        state.wizard.publish_at = new Date().toISOString();
        state.wizard.step = WIZARD_STEP.PREVIEW;
        render();
      }
    });
  });

  dom.publishAt.addEventListener("change", e => {
    if (state.wizard.step !== WIZARD_STEP.PUBLISH_MODE) return;
    state.wizard.publish_at = new Date(e.target.value).toISOString();
    state.wizard.step = WIZARD_STEP.PREVIEW;
    render();
  });
}

/* =========================================================
   WIZARD CONTROL
   ========================================================= */
function startWizard() {
  resetWizard();
  state.ui = UI_STATE.WIZARD;
  state.wizard.step = WIZARD_STEP.GROUP;
  render();
}

function cancelWizard() {
  resetWizard();
  state.ui = UI_STATE.IDLE;
  render();
}

function resetWizard() {
  state.wizard = {
    step: WIZARD_STEP.INIT,
    notice_group: null,
    notice_action: null,
    effective_date: null,
    reason_code: null,
    publish_at: null,
    supersedes_id: null
  };
  state.error = null;
}

/* =========================================================
   STEP HANDLERS
   ========================================================= */
function selectGroup(group, btn) {
  if (state.wizard.step !== WIZARD_STEP.GROUP) return;

  state.wizard.notice_group = group;
  state.wizard.step = WIZARD_STEP.ACTION;
  loadActions(group);
  setActive(btn);
  render();
}

function loadActions(group) {
  dom.actionsBox.innerHTML = "";
  ACTIONS[group].forEach(action => {
    const b = document.createElement("button");
    b.textContent = action.replace(/_/g, " ");
    b.addEventListener("click", () => {
      if (state.wizard.step !== WIZARD_STEP.ACTION) return;
      state.wizard.notice_action = action;
      state.wizard.step = WIZARD_STEP.DATE;
      setActive(b);
      render();
    });
    dom.actionsBox.appendChild(b);
  });
}

/* =========================================================
   RENDER (PURE)
   ========================================================= */
function render() {
  dom.steps.forEach(s => s.classList.add("hidden"));
  dom.wizard.classList.toggle("hidden", state.ui !== UI_STATE.WIZARD);

  if (state.ui === UI_STATE.WIZARD) {
    const stepEl = document.querySelector(
      `.wizard-step[data-step="${state.wizard.step}"]`
    );
    if (stepEl) stepEl.classList.remove("hidden");

    if (state.wizard.step === WIZARD_STEP.PREVIEW) {
      renderPreview();
      dom.confirmBtn.disabled = false;
    } else {
      dom.confirmBtn.disabled = true;
    }
  }
}

/* =========================================================
   PREVIEW
   ========================================================= */
function renderPreview() {
  dom.preview.innerHTML = `
    <strong>Official Notice (Preview)</strong><br><br>
    ${state.wizard.notice_group.replace(/_/g, " ")} –
    ${state.wizard.notice_action.replace(/_/g, " ")}<br>
    Effective date: ${state.wizard.effective_date}<br>
    ${state.wizard.reason_code ? "Reason: " + state.wizard.reason_code : ""}
  `;
}

/* =========================================================
   PUBLISH (LOCKED, SAFE)
   ========================================================= */
async function publishNotice() {
  if (state.publishing || state.ui !== UI_STATE.WIZARD) return;

  state.publishing = true;
  state.ui = UI_STATE.PUBLISHING;
  dom.confirmBtn.disabled = true;

  try {
    if (!state.wizard.publish_at) {
      state.wizard.publish_at = new Date().toISOString();
    }

    const payload = {
      notice_group: state.wizard.notice_group,
      notice_action: state.wizard.notice_action,
      effective_date: state.wizard.effective_date,
      reason_code: state.wizard.reason_code,
      publish_at: state.wizard.publish_at,
      supersedes_id: state.wizard.supersedes_id
    };

    const { error } = await supabase.from("notices").insert(payload);
    if (error) throw error;

    state.ui = UI_STATE.CONFIRMED;
    alert("Notice published successfully.");
    window.location.reload();

  } catch (err) {
    console.error(err);
    state.error = "Notice was not published. No record was created.";
    state.ui = UI_STATE.ERROR;
    alert(state.error);
    resetWizard();
    state.ui = UI_STATE.IDLE;
    render();
  } finally {
    state.publishing = false;
  }
}

/* =========================================================
   LOAD EXISTING NOTICES
   ========================================================= */
async function loadNotices() {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  dom.noticeList.innerHTML = "";

  if (error || !data || !data.length) {
    dom.noticeList.innerHTML = "<p class='muted'>No notices found.</p>";
    return;
  }

  data.forEach(n => {
    const div = document.createElement("div");
    div.className = "notice-card";

    const status = n.withdrawn_at
      ? "Withdrawn"
      : n.archived_at
        ? "Archived"
        : new Date(n.publish_at) > new Date()
          ? "Scheduled"
          : "Active";

    div.innerHTML = `
      <small>Status: ${status}</small>
      <strong>${n.notice_group.replace(/_/g, " ")} – ${n.notice_action.replace(/_/g, " ")}</strong>
      <small>Effective date: ${n.effective_date}</small>
    `;

    dom.noticeList.appendChild(div);
  });
}

/* =========================================================
   UI HELPERS
   ========================================================= */
function setActive(btn) {
  btn.parentElement
    .querySelectorAll("button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}
