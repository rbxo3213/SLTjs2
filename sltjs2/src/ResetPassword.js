// src/ResetPassword.js
import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";

function ResetPassword() {
  const [email, setEmail] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert("비밀번호 재설정 이메일이 발송되었습니다.");
    } catch (error) {
      console.error("비밀번호 재설정 에러:", error);
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>비밀번호 재설정</h2>
      <form onSubmit={handleResetPassword}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">비밀번호 재설정</button>
      </form>
    </div>
  );
}

export default ResetPassword;
