import { login, createUser, logout, onAuthChange } from "./firebaseDB.js";

const authForm = document.querySelector("#auth-form");
const signupBtn = document.querySelector("#signup-btn");
const logoutBtn = document.querySelector("#logout-btn");
const authMessage = document.querySelector("#auth-message");
const authFormCard = document.querySelector("#auth-form-card");
const authDetailsCard = document.querySelector("#auth-details-card");
const emailInput = document.querySelector("#auth-email");
const passwordInput = document.querySelector("#auth-password");
const currentUserEls = document.querySelectorAll("[data-current-user-email]");

function setAuthMessage(message = "", isError = false) {
  if (authMessage) {
    authMessage.textContent = message;
    authMessage.style.display = message ? "block" : "none";
    authMessage.classList.toggle("auth-message-error", Boolean(message && isError));
  }
  if (message && window.M && M.toast) {
    M.toast({ html: message, classes: isError ? "red" : "" });
  }
}

function setPending(pending) {
  if (!authForm) return;
  authForm.querySelectorAll("button").forEach((btn) => {
    btn.disabled = pending;
  });
  if (logoutBtn) logoutBtn.disabled = pending;
}

function setUserDetails(user) {
  const isSignedIn = Boolean(user);
  if (authFormCard) {
    authFormCard.style.display = isSignedIn ? "none" : "block";
  }
  if (authDetailsCard) {
    authDetailsCard.style.display = isSignedIn ? "block" : "none";
  }
  currentUserEls.forEach((el) => {
    el.textContent = user?.email || "";
  });
}

async function handleLogin(event) {
  event.preventDefault();
  if (!emailInput || !passwordInput) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    setAuthMessage("Email and password are required.", true);
    return;
  }

  setPending(true);
  try {
    await login(email, password);
    authForm?.reset();
    window.location.href = "index.html";
  } catch (err) {
    const msg = err?.message || "Unable to log in.";
    setAuthMessage(msg, true);
  } finally {
    setPending(false);
  }
}

async function handleSignup() {
  if (!emailInput || !passwordInput) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    setAuthMessage("Please provide an email and password.", true);
    return;
  }

  setPending(true);
  try {
    await createUser(email, password);
    setAuthMessage(`Account created for ${email}.`);
    authForm?.reset();
  } catch (err) {
    const msg = err?.message || "Unable to create account.";
    setAuthMessage(msg, true);
  } finally {
    setPending(false);
  }
}

async function handleLogout(event) {
  event.preventDefault();
  setPending(true);
  try {
    await logout();
    setAuthMessage("Logged out.");
  } catch (err) {
    const msg = err?.message || "Unable to log out.";
    setAuthMessage(msg, true);
  } finally {
    setPending(false);
  }
}

if (authForm) {
  authForm.addEventListener("submit", handleLogin);
}
if (signupBtn) {
  signupBtn.addEventListener("click", (event) => {
    event.preventDefault();
    handleSignup();
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener("click", handleLogout);
}

onAuthChange((user) => {
  setUserDetails(user);
});
