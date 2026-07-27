import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBwY91EckPyl9OdwSwBiAv7ddz6o5JJtFc",
  authDomain: "saumya-8e8d4.firebaseapp.com",
  projectId: "saumya-8e8d4",
  storageBucket: "saumya-8e8d4.firebasestorage.app",
  messagingSenderId: "948990834474",
  appId: "1:948990834474:web:e806d5736b17b1d307d053",
  measurementId: "G-BMEBQ5YHV2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
