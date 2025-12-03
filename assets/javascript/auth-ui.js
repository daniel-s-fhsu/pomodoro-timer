import { logout, onAuthChange } from "./firebaseDB.js";

const loginLinks = document.querySelectorAll("[data-auth-login-link]");
const logoutLinks = document.querySelectorAll("[data-auth-logout-link]");
const emailTargets = document.querySelectorAll("[data-auth-email]");
const emailContainers = Array.from(
  new Set(
    Array.from(emailTargets).map((el) => el.closest("li") || el)
  )
);
const warningBlocks = document.querySelectorAll("[data-auth-warning]");

function toggleElements(elements, show) {
  elements.forEach((el) => {
    const target = el.closest("li") || el;
    target.style.display = show ? "" : "none";
  });
}

function setEmailText(user) {
  const text = user?.email || "";
  emailTargets.forEach((el) => {
    el.textContent = text;
  });
  emailContainers.forEach((el) => {
    el.style.display = user ? "" : "none";
  });
}

function showToast(message, isError = false) {
  if (!message) return;
  if (window.M && M.toast) {
    M.toast({ html: message, classes: isError ? "red" : "" });
  } else {
    console.log(message);
  }
}

logoutLinks.forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await logout();
      showToast("Logged out.");
    } catch (err) {
      const msg = err?.message || "Unable to log out.";
      showToast(msg, true);
    }
  });
});

onAuthChange((user) => {
  toggleElements(loginLinks, !user);
  toggleElements(logoutLinks, Boolean(user));
  setEmailText(user);
  warningBlocks.forEach((el) => {
    el.style.display = user ? "none" : "";
  });
});
