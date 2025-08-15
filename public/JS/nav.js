


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYv4zwDoCuMKnln2ZCX-8C9EYnxKTEGN4",
  authDomain: "cow-gear.firebaseapp.com",
  projectId: "cow-gear",
  storageBucket: "cow-gear.firebasestorage.app",
  messagingSenderId: "216065498839",
  appId: "1:216065498839:web:052e0aee77002818781a92"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Mobile Menu Toggle ---
const toggleOpen = document.getElementById('toggleOpen');
const toggleClose = document.getElementById('toggleClose');
const collapseMenu = document.getElementById('collapseMenu');

function handleClick() {
  if (collapseMenu.style.display === 'block') {
    collapseMenu.style.display = 'none';
  } else {
    collapseMenu.style.display = 'block';
  }
}

toggleOpen?.addEventListener('click', handleClick);
toggleClose?.addEventListener('click', handleClick);

// --- Auth-Based Nav Button Display ---
const loginBtn = document.getElementById("navLoginBtn");
const signupBtn = document.getElementById("navSignupBtn");
const profileBtn = document.getElementById("navProfileBtn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Logged in
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
    if (profileBtn) profileBtn.style.display = "inline-block";
  } else {
    // Not logged in
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (signupBtn) signupBtn.style.display = "inline-block";
    if (profileBtn) profileBtn.style.display = "none";
  }
});
