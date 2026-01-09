import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================================================
   SUPABASE CLIENT
========================================================= */
const supabase = createClient(
  "https://hnccoqttbsrkgiqhzvsf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2NvcXR0YnNya2dpcWh6dnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDczMjEsImV4cCI6MjA4MzQ4MzMyMX0.ObeLI4w7sZutjUQvP8HK_cxVPngpgfx8gJIzQutdTio"
);

/* =========================================================
   ENUMS
========================================================= */
const UI_STATE = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  IDLE: "IDLE",
  WIZARD: "WIZARD",
  PUBLISHING: "PUBLISHING"
});

const WIZARD_STEP = Object.freeze({
  GROUP: 1,
  ACTION: 2,
  DATE: 3,
  REASON: 4,
  PUBLISH_MODE: 5,
  PREVIEW: 6
});

/* =========================================================
   STATE
========================================================= */
const state = {
  ui: UI_STATE.UNAUTHENTICATED,
  publishing: false,
  wizard: {
    step: null,
    notice_group: null,
    notice_action: null,
    effective_date: null,
    reason_code: null,
    publish_at: null
  }
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
   DOM
========================================================= */
let dom = {};

/* =========================================================
   INIT
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
   DOM BINDINGS
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
    cancelBtn: document.getElementById("cancelWizard"),
    confirmBtn: document.getElementById("confirmPublish"),

    next1: document.getElementById("nextStep1"),
    next2: document.getElementById("nextStep2"),
    next3: document.getElementById("nextStep3"),
    next4: document.getElementById("nextStep4"),
    next5: document.getElementById("nextStep5"),

    back2: document.getElementById("backStep2"),
    back3: document.getElementById("backStep3"),
    back4: document.getElementById("backStep4"),
    back5: document.getElementById("backStep5")
  };

  dom.startBtn.onclick = startWizard;
  dom.cancelBtn.onclick = cancelWizard;
  dom.confirmBtn.onclick = publishNotice;

  dom.next1.onclick = () => gotoStep(WIZARD_STEP.ACTION, loadActions);
  dom.next2.onclick = () => gotoStep(WIZARD_STEP.DATE);
  dom.next3.onclick = () => gotoStep(WIZARD_STEP.REASON);
  dom.next4.onclick = () => gotoStep(WIZARD_STEP.PUBLISH_MODE);
  dom.next5.onclick = () => gotoStep(WIZARD_STEP.PREVIEW);

  dom.back2.onclick = () => gotoStep(WIZARD_STEP.GROUP);
  dom.back3.onclick = () => gotoStep(WIZARD_STEP.ACTION);
  dom.back4.onclick = () => gotoStep(WIZARD_STEP.DATE);
  dom.back5.onclick = () => gotoStep(WIZARD_STEP.REASON);

  document.querySelectorAll("[data-group]").forEach(b =>
    b.onclick = () => {
      state.wizard.notice_group = b.dataset.group;
      setActive(b);
      dom.next1.disabled = false;
    }
  );

  dom.effectiveDate.onchange = e => {
    state.wizard.effective_date = e.target.value;
    dom.next3.disabled = false;
  };

  document.querySelectorAll("[data-reason]").forEach(b =>
    b.onclick = () => {
      state.wizard.reason_code = b.dataset.reason || null;
      setActive(b);
      dom.next4.disabled = false;
    }
  );

  document.querySelectorAll('input[name="publishMode"]').forEach(r =>
    r.onchange = () => {
      if (r.value === "later") {
        dom.publishAt.classList.remove("hidden");
        state.wizard.publish_at = null;
        dom.next5.disabled = true;
      } else {
        dom.publishAt.classList.add("hidden");
        state.wizard.publish_at = new Date().toISOString();
        dom.next5.disabled = false;
      }
    }
  );

  dom.publishAt.onchange = e => {
    state.wizard.publish_at = new Date(e.target.value).toISOString();
    dom.next5.disabled = false;
  };
}

/* =========================================================
   WIZARD FLOW
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

function gotoStep(step, hook) {
  if (hook) hook(state.wizard.notice_group);
  state.wizard.step = step;
  render();
}

function resetWizard() {
  state.wizard = {
    step: null,
    notice_group: null,
    notice_action: null,
    effective_date: null,
    reason_code: null,
    publish_at: null
  };

  [dom.next1, dom.next2, dom.next3, dom.next4, dom.next5]
    .forEach(b => b && (b.disabled = true));
}

/* =========================================================
   ACTION LOADER
========================================================= */
function loadActions(group) {
  dom.actionsBox.innerHTML = "";
  ACTIONS[group].forEach(a => {
    const b = document.createElement("button");
    b.textContent = a.replace(/_/g, " ");
    b.onclick = () => {
      state.wizard.notice_action = a;
      setActive(b);
      dom.next2.disabled = false;
    };
    dom.actionsBox.appendChild(b);
  });
}

/* =========================================================
   RENDER
========================================================= */
function render() {
  dom.steps.forEach(s => s.classList.add("hidden"));
  dom.wizard.classList.toggle("hidden", state.ui !== UI_STATE.WIZARD);

  if (state.ui === UI_STATE.PUBLISHING) {
    dom.preview.innerHTML = "<strong>Publishing notice…</strong>";
    return;
  }

  if (state.ui === UI_STATE.WIZARD) {
    const step = document.querySelector(`.wizard-step[data-step="${state.wizard.step}"]`);
    if (step) step.classList.remove("hidden");

    dom.confirmBtn.disabled = state.wizard.step !== WIZARD_STEP.PREVIEW;
    if (state.wizard.step === WIZARD_STEP.PREVIEW) renderPreview();
  }
}

/* =========================================================
   PREVIEW
========================================================= */
function renderPreview() {
  dom.preview.innerHTML = `
    <strong>Official Notice (Preview)</strong><br><br>
    ${state.wizard.notice_group.replace(/_/g," ")} –
    ${state.wizard.notice_action.replace(/_/g," ")}<br>
    Effective date: ${state.wizard.effective_date}
  `;
}

/* =========================================================
   PUBLISH
========================================================= */
async function publishNotice() {
  if (state.publishing) return;
  state.publishing = true;
  state.ui = UI_STATE.PUBLISHING;
  render();

  await supabase.from("notices").insert({
    notice_group: state.wizard.notice_group,
    notice_action: state.wizard.notice_action,
    effective_date: state.wizard.effective_date,
    reason_code: state.wizard.reason_code,
    publish_at: state.wizard.publish_at
  });

  window.location.reload();
}

/* =========================================================
   LOAD RECORDS
========================================================= */
async function loadNotices() {
  const { data } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  dom.noticeList.innerHTML = "";
  data?.forEach(n => {
    const d = document.createElement("div");
    d.className = "notice-card";
    d.innerHTML = `
      <strong>${n.notice_group.replace(/_/g," ")} – ${n.notice_action.replace(/_/g," ")}</strong>
      <small>Effective: ${n.effective_date}</small>
    `;
    dom.noticeList.appendChild(d);
  });
}

/* =========================================================
   HELPERS
========================================================= */
function setActive(btn) {
  btn.parentElement.querySelectorAll("button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* =========================================================
   UNLOAD GUARD (CORRECT)
========================================================= */
window.addEventListener("beforeunload", e => {
  if (state.ui === UI_STATE.WIZARD) {
    e.preventDefault();
    e.returnValue = "";
  }
});
