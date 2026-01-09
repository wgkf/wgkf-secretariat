import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================================================
   SUPABASE CLIENT
========================================================= */
const supabase = createClient(
  "https://hnccoqttbsrkgiqhzvsf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY2NvcXR0YnNya2dpcWh6dnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDczMjEsImV4cCI6MjA4MzQ4MzMyMX0.ObeLI4w7sZutjUQvP8HK_cxVPngpgfx8gJIzQutdTio"
);

/* =========================================================
   STATES
========================================================= */
const UI_STATE = {
  IDLE: "IDLE",
  WIZARD: "WIZARD",
  PUBLISHING: "PUBLISHING"
};

const STEP = {
  GROUP: 1,
  ACTION: 2,
  DATE: 3,
  REASON: 4,
  PUBLISH: 5,
  PREVIEW: 6
};

/* =========================================================
   STATE
========================================================= */
const state = {
  ui: UI_STATE.IDLE,
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
document.addEventListener("DOMContentLoaded", async () => {
  bindDom();
  await guardSession();
  await loadNotices();
  render();
});

/* =========================================================
   AUTH
========================================================= */
async function guardSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) window.location.href = "index.html";
}

/* =========================================================
   DOM BINDINGS
========================================================= */
function bindDom() {
  dom = {
    wizard: document.getElementById("wizard"),
    steps: [...document.querySelectorAll(".wizard-step")],
    actions: document.getElementById("actions"),
    effectiveDate: document.getElementById("effectiveDate"),
    publishAt: document.getElementById("publishAt"),
    preview: document.getElementById("preview"),
    noticeList: document.getElementById("noticeList"),

    startBtn: document.getElementById("startNoticeBtn"),
    cancelBtn: document.getElementById("cancelWizard"),
    confirmBtn: document.getElementById("confirmPublish"),
    backBtn: document.getElementById("backToDashboardBtn"),

    back2: document.getElementById("backStep2"),
    back3: document.getElementById("backStep3"),
    back4: document.getElementById("backStep4"),
    back5: document.getElementById("backStep5"),
    back6: document.getElementById("backStep6")
  };

  dom.startBtn.onclick = startWizard;
  dom.cancelBtn.onclick = cancelWizard;
  dom.confirmBtn.onclick = publishNotice;
  dom.backBtn.onclick = () => window.location.href = "dashboard.html";

  dom.back2.onclick = () => goto(STEP.GROUP);
  dom.back3.onclick = () => goto(STEP.ACTION);
  dom.back4.onclick = () => goto(STEP.DATE);
  dom.back5.onclick = () => goto(STEP.REASON);
  if (dom.back6) dom.back6.onclick = () => goto(STEP.PUBLISH);

  document.querySelectorAll("[data-group]").forEach(b =>
    b.onclick = () => {
      state.wizard.notice_group = b.dataset.group;
      setActive(b);
      loadActions(b.dataset.group);
      goto(STEP.ACTION);
    }
  );

  dom.effectiveDate.onchange = e => {
    state.wizard.effective_date = e.target.value;
    goto(STEP.REASON);
  };

  document.querySelectorAll("[data-reason]").forEach(b =>
    b.onclick = () => {
      state.wizard.reason_code = b.dataset.reason || null;
      setActive(b);
      goto(STEP.PUBLISH);
    }
  );

document.querySelectorAll('input[name="publishMode"]').forEach(radio => {
  radio.addEventListener("click", () => {
    if (radio.value === "later") {
      dom.publishAt.classList.remove("hidden");
      state.wizard.publish_at = null;
    }

    if (radio.value === "now") {
      dom.publishAt.classList.add("hidden");
      state.wizard.publish_at = new Date().toISOString();
      goto(STEP.PREVIEW); // 🔑 USER INTENT
    }
  });
});


  dom.publishAt.onchange = e => {
    state.wizard.publish_at = new Date(e.target.value).toISOString();
    setTimeout(() => goto(STEP.PREVIEW), 120);
  };
}


/* =========================================================
   WIZARD CONTROL
========================================================= */
function startWizard() {
  resetWizard();
  state.ui = UI_STATE.WIZARD;
  goto(STEP.GROUP);
}

function cancelWizard() {
  resetWizard();
  state.ui = UI_STATE.IDLE;
  render();
}

function goto(step) {
  state.wizard.step = step;

  if (step === STEP.PUBLISH) {
    initialisePublishStep(); // 🔑 FIXES DEAD DEFAULT
  }

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
}

/* =========================================================
   ACTIONS
========================================================= */
function loadActions(group) {
  dom.actions.innerHTML = "";
  ACTIONS[group].forEach(a => {
    const b = document.createElement("button");
    b.textContent = a.replace(/_/g, " ");
    b.onclick = () => {
      state.wizard.notice_action = a;
      setActive(b);
      goto(STEP.DATE);
    };
    dom.actions.appendChild(b);
  });
}

/* =========================================================
   RENDER
========================================================= */
function render() {
  dom.steps.forEach(s => s.classList.add("hidden"));
  dom.wizard.classList.toggle("hidden", state.ui !== UI_STATE.WIZARD);

  if (state.ui === UI_STATE.WIZARD) {
    const step = document.querySelector(`.wizard-step[data-step="${state.wizard.step}"]`);
    if (step) step.classList.remove("hidden");

    dom.confirmBtn.disabled = state.wizard.step !== STEP.PREVIEW;
    if (state.wizard.step === STEP.PREVIEW) renderPreview();
  }

  if (state.ui === UI_STATE.PUBLISHING) {
    dom.preview.innerHTML = "<strong>Publishing notice…</strong>";
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

function initPublishStep() {
  const checked = document.querySelector('input[name="publishMode"]:checked');

  if (!checked) return;

  if (checked.value === "now") {
    dom.publishAt.classList.add("hidden");
    state.wizard.publish_at = new Date().toISOString();
  } else {
    dom.publishAt.classList.remove("hidden");
    state.wizard.publish_at = null;
  }
}
function initialisePublishStep() {
  const checked = document.querySelector(
    'input[name="publishMode"]:checked'
  );

  if (!checked) return;

  if (checked.value === "now") {
    dom.publishAt.classList.add("hidden");
    state.wizard.publish_at = new Date().toISOString();
  } else {
    dom.publishAt.classList.remove("hidden");
    state.wizard.publish_at = null;
  }
}


/* =========================================================
   UNLOAD GUARD
========================================================= */
window.addEventListener("beforeunload", e => {
  if (state.ui === UI_STATE.WIZARD) {
    e.preventDefault();
    e.returnValue = "";
  }
});
