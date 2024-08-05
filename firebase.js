// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB32gJJ_p8535-iFLelnKh4XYHwsDc9g94",
  authDomain: "chantry-a.firebaseapp.com",
  projectId: "chantry-a",
  storageBucket: "chantry-a.appspot.com",
  messagingSenderId: "468012450489",
  appId: "1:468012450489:web:65baf993169072db7a1168",
  measurementId: "G-PGRBD4ZLJS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);