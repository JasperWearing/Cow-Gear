import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDYv4zwDoCuMKnln2ZCX-8C9EYnxKTEGN4",
  authDomain: "cow-gear.firebaseapp.com",
  projectId: "cow-gear",
  storageBucket: "cow-gear.appspot.com",
  messagingSenderId: "216065498839",
  appId: "1:216065498839:web:052e0aee77002818781a92"
};

// ✅ Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ DOM Elements
const greeting = document.getElementById("greeting");
const activeBookingsDiv = document.getElementById("activeBookings");
const bookingHistoryDiv = document.getElementById("bookingHistory");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

// ✅ Auth State
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  const name = userDoc.exists() ? userDoc.data().name : "User";
  greeting.textContent = `Hello, ${name}`;

  if (userDoc.exists() && userDoc.data().role === "admin") {
    adminLink.classList.remove("hidden");
  }

  loadBookings(user.uid);
});

// ✅ Helper: Fetch gear title
async function getGearTitle(gearId) {
  try {
    const gearDoc = await getDoc(doc(db, "gear", gearId));
    return gearDoc.exists() ? gearDoc.data().title || "Unnamed Gear" : "Unnamed Gear";
  } catch (error) {
    console.error("Error fetching gear:", error);
    return "Unnamed Gear";
  }
}

// ✅ Load bookings for current user
async function loadBookings(uid) {
  const bookingsRef = collection(db, "bookings");

  // 🔹 Active bookings
  const activeQuery = query(bookingsRef, where("userId", "==", uid), where("active", "==", true));
  const activeSnap = await getDocs(activeQuery);
  activeBookingsDiv.innerHTML = "";

  if (activeSnap.empty) {
    activeBookingsDiv.innerHTML = "<p>No active bookings.</p>";
  } else {
    for (const docSnap of activeSnap.docs) {
      const data = docSnap.data();
      const gearTitle = await getGearTitle(data.gearId);

      const bookingDiv = document.createElement("div");
      bookingDiv.className = "flex justify-between items-center bg-white p-4 rounded shadow mb-2";

      bookingDiv.innerHTML = `
        <span class="text-lg">${gearTitle}</span>
        <button class="returnBtn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" data-id="${docSnap.id}">
          Return
        </button>
      `;
      activeBookingsDiv.appendChild(bookingDiv);
    }

    // ✅ Add event listeners for Return buttons
    document.querySelectorAll(".returnBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const bookingId = btn.getAttribute("data-id");
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) {
          alert("Booking not found.");
          return;
        }

        const bookingData = bookingSnap.data();
        const gearId = bookingData.gearId;

        // ✅ Mark booking as returned
        await updateDoc(bookingRef, {
          active: false,
          returnedAt: Timestamp.now()
        });

        // ✅ Mark gear as available
        await updateDoc(doc(db, "gear", gearId), {
          available: true
        });

        loadBookings(bookingData.userId); // 🔁 Refresh list
      });
    });
  }

  // 🔹 Past bookings (last 180 days)
  const now = new Date();
  const daysAgo180 = new Date(now.setDate(now.getDate() - 180));
  const pastQuery = query(bookingsRef, where("userId", "==", uid));
  const pastSnap = await getDocs(pastQuery);
  bookingHistoryDiv.innerHTML = "";

  const filteredHistory = pastSnap.docs.filter(docSnap => {
    const data = docSnap.data();
    return !data.active && data.timestamp?.toDate() > daysAgo180;
  });

  if (filteredHistory.length === 0) {
    bookingHistoryDiv.innerHTML = "<p>No booking history in the past 180 days.</p>";
  } else {
    for (const docSnap of filteredHistory) {
      const data = docSnap.data();
      const gearTitle = await getGearTitle(data.gearId);
      const date = data.timestamp?.toDate().toLocaleDateString();

      const historyDiv = document.createElement("div");
      historyDiv.className = "bg-white p-4 rounded shadow mb-2";

      historyDiv.innerHTML = `
        <span class="text-lg">${gearTitle}</span>
        <p class="text-sm text-gray-600">Booked on: ${date}</p>
      `;
      bookingHistoryDiv.appendChild(historyDiv);
    }
  }
}

// ✅ Logout button
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/index.html";
});
