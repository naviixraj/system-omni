import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBe86eav4zn8cirBzk4ZAqgR03IFgOgPhM",
  authDomain: "omni-system-fcd83.firebaseapp.com",
  projectId: "omni-system-fcd83",
  storageBucket: "omni-system-fcd83.firebasestorage.app",
  messagingSenderId: "868049144978",
  appId: "1:868049144978:web:8672471d301b6b899a2a4b",
  measurementId: "G-FQT4F0XXCY"
};

// Initialize Firebase for Client Environment
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Safe Analytics Initialization
if (typeof window !== "undefined") {
  isSupported().then((supported: boolean) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}
