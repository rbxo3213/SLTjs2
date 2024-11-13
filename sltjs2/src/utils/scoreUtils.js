// src/utils/scoreUtils.js

import { db } from "../firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { auth } from "../firebaseConfig";

export const saveScore = async (score, type) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const docRef = await addDoc(collection(db, "scores"), {
        email: user.email,
        score: score,
        type: type, // 퀴즈 유형 저장
        createdAt: Timestamp.now(),
      });
      console.log("Score saved with ID:", docRef.id);
    } else {
      console.log("No user is currently signed in.");
    }
  } catch (error) {
    console.error("Error saving score:", error);
  }
};
