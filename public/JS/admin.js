// csvExport.js
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDYv4zwDoCuMKnln2ZCX-8C9EYnxKTEGN4",
  authDomain: "cow-gear.firebaseapp.com",
  projectId: "cow-gear",
  storageBucket: "cow-gear.appspot.com",
  messagingSenderId: "216065498839",
  appId: "1:216065498839:web:052e0aee77002818781a92"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔧 DOM Elements
const categorySelect = document.getElementById("categorySelect");
const gearSelect = document.getElementById("gearSelect");
const userSelect = document.getElementById("userSelect");
const exportGearCSV = document.getElementById("exportGearCSV");
const exportUserCSV = document.getElementById("exportUserCSV");

// 📦 Populate gear dropdown
categorySelect.addEventListener("change", async () => {
  gearSelect.innerHTML = '<option value="">Select Gear</option>';
  if (!categorySelect.value) return;

  const gearQuery = query(collection(db, "gear"), where("category", "==", categorySelect.value));
  const gearSnap = await getDocs(gearQuery);
  gearSnap.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().title || "Unnamed Gear";
    gearSelect.appendChild(opt);
  });
});

// 👤 Populate user dropdown
async function populateUsers() {
  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().name || "Unnamed User";
    userSelect.appendChild(opt);
  });
}
populateUsers();

// 📆 Convert Firestore Timestamp or fallback to now
function getDate(ts) {
  if (!ts) return new Date();
  if (ts.toDate) return ts.toDate();
  return new Date(ts);
}

// 🧠 Check overlap of booking range with selected range
function bookingOverlaps(bookingStart, bookingEnd, rangeStart, rangeEnd) {
  return bookingStart <= rangeEnd && bookingEnd >= rangeStart;
}

// 📤 Download CSV helper
function downloadCSV(rows, filename) {
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 🚀 Export Gear CSV
exportGearCSV.addEventListener("click", async () => {
  const gearId = gearSelect.value;
  const start = new Date(document.getElementById("gearStart").value);
  const end = new Date(document.getElementById("gearEnd").value);

  if (!gearId || !start || !end) return alert("Fill all fields.");

  const q = query(collection(db, "bookings"), where("gearId", "==", gearId));
  const bookingsSnap = await getDocs(q);

  const rows = [["User Name", "Start", "End", "Gear Name"]];
  for (const docSnap of bookingsSnap.docs) {
    const data = docSnap.data();
    const bStart = getDate(data.timestamp);
    const bEnd = data.returnedAt ? getDate(data.returnedAt) : new Date();

    if (!bookingOverlaps(bStart, bEnd, start, end)) continue;

    const userRef = doc(db, "users", data.userId);
    const userSnap = await getDoc(userRef);
    const userName = userSnap.exists() ? userSnap.data().name : "Unknown";

    rows.push([
      `"${userName}"`,
      bStart.toISOString(),
      bEnd.toISOString(),
      `"${data.gearName || "Unknown"}"`
    ]);
  }

  downloadCSV(rows, "gear-bookings.csv");
});

// 🚀 Export User CSV
exportUserCSV.addEventListener("click", async () => {
  const userId = userSelect.value;
  const start = new Date(document.getElementById("userStart").value);
  const end = new Date(document.getElementById("userEnd").value);

  if (!userId || !start || !end) return alert("Fill all fields.");

  const q = query(collection(db, "bookings"), where("userId", "==", userId));
  const bookingsSnap = await getDocs(q);

  const rows = [["Gear Name", "Start", "End"]];
  bookingsSnap.forEach(docSnap => {
    const data = docSnap.data();
    const bStart = getDate(data.timestamp);
    const bEnd = data.returnedAt ? getDate(data.returnedAt) : new Date();

    if (!bookingOverlaps(bStart, bEnd, start, end)) return;

    rows.push([
      `"${data.gearName || "Unknown"}"`,
      bStart.toISOString(),
      bEnd.toISOString()
    ]);
  });

  downloadCSV(rows, "user-bookings.csv");
});
