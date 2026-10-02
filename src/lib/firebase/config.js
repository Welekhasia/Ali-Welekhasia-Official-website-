import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAAS2IX32IIo1ZfLxItVVFQTNlNwdLPUE4",
  authDomain: "gospelsphere.firebaseapp.com",
  databaseURL: "https://gospelsphere-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gospelsphere",
  storageBucket: "gospelsphere.firebasestorage.app",
  messagingSenderId: "559287679702",
  appId: "1:559287679702:web:46c4c7f11579a1b04ca777",
  measurementId: "G-71TTN91D8R"
};

let initializedApp;
try {
  if (typeof window !== 'undefined' && window.firebase && window.firebase.apps && window.firebase.apps.length) {
    initializedApp = window.firebase.app();
  } else if (getApps().length > 0) {
    initializedApp = getApp();
  } else {
    initializedApp = initializeApp(firebaseConfig);
  }
} catch (e) {
  console.warn('[Firebase Config] Fallback initialization:', e);
}

export const app = initializedApp;
