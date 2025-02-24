import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCrioCkLqF9LWvRztVO_ZCFWYu2lZO253c",
  authDomain: "agenda-f8080.firebaseapp.com",
  projectId: "agenda-f8080",
  storageBucket: "agenda-f8080.firebasestorage.app",
  messagingSenderId: "3237658651",
  appId: "1:3237658651:web:3d2e05e0e85f269f9b38be"
};

export const firebaseApp = initializeApp(firebaseConfig);
