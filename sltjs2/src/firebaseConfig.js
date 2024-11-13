// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Firestore 모듈 추가

const firebaseConfig = {
  apiKey: "AIzaSyBf4DESryLVfpZsFbv22tQTN6yJxgAhRNs",
  authDomain: "sltjs2.firebaseapp.com",
  projectId: "sltjs2",
  storageBucket: "sltjs2.appspot.com",
  messagingSenderId: "416828712955",
  appId: "1:416828712955:web:4e4d4d9900b4109e360d5e",
  measurementId: "G-SS44FR90SZ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Firestore 초기화

export { auth, db };
