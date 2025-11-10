// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFw3T4YNqodDSmarwgTuXwcZSa24RGWf4",
  authDomain: "pomodoro-timer-e9801.firebaseapp.com",
  projectId: "pomodoro-timer-e9801",
  storageBucket: "pomodoro-timer-e9801.firebasestorage.app",
  messagingSenderId: "526834719775",
  appId: "1:526834719775:web:447709257a651ab85fc92a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export default app;