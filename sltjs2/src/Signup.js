// src/Signup.js

import React, { useState } from "react";
import { auth, db } from "./firebaseConfig"; // Firestore 객체 임포트
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore 함수 임포트
import { useNavigate } from "react-router-dom";

function Signup({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 사용자 프로필에 닉네임 설정
      await updateProfile(user, {
        displayName: nickname,
      });

      // Firestore에 사용자 정보 저장
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          nickname: nickname,
          provider: "email",
          createdAt: new Date(),
        },
        { merge: true }
      );

      onSuccess();
      navigate("/");
    } catch (error) {
      console.error("회원가입 에러:", error);
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">회원가입</button>
      </form>
    </div>
  );
}

export default Signup;
