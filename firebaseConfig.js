import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyCrioCkLqF9LWvRztVO_ZCFWYu2lZO253c",
  authDomain: "agenda-f8080.firebaseapp.com",
  projectId: "agenda-f8080",
  storageBucket: "agenda-f8080.firebasestorage.app",
  messagingSenderId: "3237658651",
  appId: "1:3237658651:web:3d2e05e0e85f269f9b38be"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const firebaseApp = app; // Alias for backward compatibility
export const db = getFirestore(app);

// Also export as default if needed
export default { app, firebaseApp: app, db };