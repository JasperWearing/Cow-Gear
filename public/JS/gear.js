// gear.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDYv4zwDoCuMKnln2ZCX-8C9EYnxKTEGN4",
  authDomain: "cow-gear.firebaseapp.com",
  projectId: "cow-gear",
  storageBucket: "cow-gear.appspot.com",
  messagingSenderId: "216065498839",
  appId: "1:216065498839:web:052e0aee77002818781a92"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ DOM Elements
const categorySelect = document.getElementById("cat");
const gearList = document.getElementById("gearList");
const bookingForm = document.getElementById("bookingForm");

// ✅ Load gear when category changes
categorySelect.addEventListener("change", async () => {
  const selectedCategory = categorySelect.value;
  gearList.innerHTML = "";

  if (!selectedCategory) return;

  const gearQuery = query(
    collection(db, "gear"),
    where("category", "==", selectedCategory),
    where("available", "==", true)
  );

  const querySnapshot = await getDocs(gearQuery);
  displayGear(querySnapshot.docs);
});

// ✅ Display gear using Tailwind
function displayGear(gearDocs) {
  gearList.innerHTML = "";

  if (gearDocs.length === 0) {
    gearList.innerHTML = "<p class='text-center text-gray-500'>No gear available in this category.</p>";
    return;
  }

  gearDocs.forEach(docSnap => {
    const gear = docSnap.data();

    const item = document.createElement("div");
    item.className = "flex items-center justify-between bg-gray-100 border rounded-md px-4 py-3 mb-2";

    const label = document.createElement("label");
    label.textContent = gear.title || "Unnamed Gear";
    label.className = "text-lg font-medium";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "gear";
    checkbox.value = docSnap.id;
    checkbox.className = "w-5 h-5";

    item.appendChild(label);
    item.appendChild(checkbox);
    gearList.appendChild(item);
  });
}

// ✅ Handle booking submission
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const selectedGear = Array.from(document.querySelectorAll("input[name='gear']:checked")).map(cb => cb.value);
  if (selectedGear.length === 0) {
    alert("Please select at least one item to book.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("You must be signed in to book gear.");
    return;
  }

  try {
    for (const gearId of selectedGear) {
      // Fetch the gear to get its title
      const gearRef = doc(db, "gear", gearId);
      const gearSnap = await getDoc(gearRef);
      const gearData = gearSnap.exists() ? gearSnap.data() : {};

      // Create booking
      await addDoc(collection(db, "bookings"), {
        gearId,
        userId: user.uid,
        timestamp: serverTimestamp(),
        active: true,
        gearName: gearData.title || "Unnamed Gear"
      });

      // Mark gear as unavailable
      await updateDoc(gearRef, {
        available: false
      });
    }

    alert("✅ Gear booked successfully!");
    bookingForm.reset();
    gearList.innerHTML = "";
  } catch (err) {
    console.error("Error booking gear:", err);
    alert("❌ Failed to book gear. Try again.");
  }
});
