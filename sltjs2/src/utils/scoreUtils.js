// src/utils/scoreUtils.js

import { auth, db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export async function saveScore(score, quizType) {
  const user = auth.currentUser;
  if (user) {
    try {
      await addDoc(collection(db, "scores"), {
        uid: user.uid,
        email: user.email || null,
        score: score,
        type: quizType,
        createdAt: new Date(),
      });
      console.log("Score saved successfully");
    } catch (error) {
      console.error("Error saving score:", error);
    }
  } else {
    console.error("User is not authenticated");
  }
}
