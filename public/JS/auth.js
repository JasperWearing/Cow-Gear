// === Firebase Configuration ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const db = getFirestore(app);

// === Helper Functions ===
function getFormValues() {
  const nameInput = document.querySelector('input[name="Name"]');
  const email = document.querySelector('input[name="Email"]')?.value ?? "";
  const password = document.querySelector('input[name="password"]')?.value ?? "";
  const name = nameInput ? nameInput.value : null;
  return { name, email, password };
}


function redirectToDashboard() {
  window.location.href = "/index.html"; // Update as needed
}

function showError(error) {
  alert(error.message);
}

// === Sign Up Logic ===
document.addEventListener("DOMContentLoaded", () => {
  const headingText = document.querySelector("h2")?.innerText.toLowerCase();
  const button = document.querySelector("button");

  if (!headingText || !button) return;

  if (headingText.includes("create a account")) {
    // Sign Up Page
    button.addEventListener("click", async () => {
      const { name, email, password } = getFormValues();

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: email,
          role: "user"
        });

        redirectToDashboard();
      } catch (error) {
        showError(error);
      }
    });

    // Go to Login page
    document.querySelector("p a").addEventListener("click", () => {
      window.location.href = "/login.html";
    });

  } else if (headingText.includes("sign in")) {
    // Login Page
    button.addEventListener("click", () => {
      const { email, password } = getFormValues();
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          redirectToDashboard();
        })
        .catch(showError);
    });

    // Go to Sign Up page
    document.querySelector("p a").addEventListener("click", () => {
      window.location.href = "/signup.html";
    });
  }
});

// === Password Reset ===
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent. Check your inbox.");
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    alert(`Error: ${error.message}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("sendEmailBtn");
  const emailInput = document.getElementById("emailInput");

  if (resetBtn && emailInput) {
    resetBtn.addEventListener("click", () => {
      const email = emailInput.value.trim();
      if (!email) {
        alert("Please enter your email.");
        return;
      }
      resetPassword(email);
    });
  }
});
