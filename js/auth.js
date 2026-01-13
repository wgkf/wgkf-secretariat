import { supabase } from "./supabaseClient.js";

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    errorMsg.textContent = "Invalid login credentials.";
    return;
  }

  window.location.href = "dashboard.html";
});
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

console.log("LOGIN DATA:", data);
console.log("LOGIN ERROR:", error);
