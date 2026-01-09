import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_PUBLIC_ANON_KEY"
);

// Guard: redirect if not logged in
(async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  }
})();

window.goTo = function (page) {
  window.location.href = page;
};

window.logout = async function () {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};
