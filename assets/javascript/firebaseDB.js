import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {  getFirestore,
          collection,
          addDoc,
          getDocs,
          deleteDoc,
          updateDoc,
          doc,
 } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js"

 import { getAuth,
          createUserWithEmailAndPassword,
          signInWithEmailAndPassword,
          signOut
  } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

export async function addStatToFirebase(stat) {
  try {
    const docRef = await addDoc(collection(db, "stats"), stat);
    return { id: docRef.id, ...stat};
  } catch (e) {
    console.error("Error adding stat block: ", e);
  }
}

export async function getStatsFromFirebase() {
  const stats = [];
  try {
    const querySnapshot = await getDocs(collection(db, "stats"));
    querySnapshot.forEach((doc) => {
      stats.push({id: doc.id, ...doc.data() });
    });
  } catch(e) {
    console.error("Error retreiving stats: ", e)
  }
  return stats;
}

export async function deleteStatFromFirebase(id) {
  try {
    const statsRef = doc(db, "stats", id);
    await deleteDoc(statsRef);
  } catch(e) {
    console.error("Error deleting stat block: ", e);
  }
}

export async function updateStatFirebase(id, updatedData) {
  try {
    const statsRef = doc(db, "stats", id);
    await updateDoc(statsRef, updatedData);
  } catch(e) {
    console.error("Error updating stat block: ", e);
  }
}

export async function createUser(email, password) {
  let newUser = null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    newUser = userCredential.user;
  } catch (e) {
    console.error("Error creating user");
  }
  return newUser;
}

export function login (email,password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout () {
  return signOut(auth);
}