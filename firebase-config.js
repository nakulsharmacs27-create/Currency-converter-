import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKhM_F7KABUFgaza3W_HcvQF1xkgkIXKM",
  authDomain: "caloxi.firebaseapp.com",
  projectId: "caloxi",
  storageBucket: "caloxi.firebasestorage.app",
  messagingSenderId: "954872017033",
  appId: "1:954872017033:web:f08665281de09a6f555658",
  measurementId: "G-XVZGRZGN9H"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
